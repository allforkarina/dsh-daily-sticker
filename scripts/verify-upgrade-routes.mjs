// Isolated DSH 0.1.0 -> 0.2.0 verification. Uses only the upgrade test profile.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

const profile = resolve('.test-runtime/home/profiles/daily-learning-upgrade');
const root = resolve('.test-runtime/upgrade-data-020');
const stateFile = join(root, 'store/state.json');
const originalFile = resolve('.test-runtime/upgrade-state-original.json');
const reportFile = resolve('.test-runtime/upgrade-verification.json');
const countFile = resolve('.test-runtime/upgrade-fixture-calls.json');
const day = '2026-10-10';
const mode = process.argv[2];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async path => { try { await access(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
if (mode === 'seed') {
  assert.equal(await exists(root), false, 'Upgrade verification requires a fresh isolated data directory');
  const old = await import(pathToFileURL(join(profile, 'node_modules/dsh-daily-learning/lib/domain.js')));
  const prefs = old.defaults(); delete prefs.learningRequests;
  prefs.roles.llm = '升级验证旧角色：只提问并引导手算。'; prefs.project = '升级验证旧工程：本地工具调用演示。';
  const plan = old.makeTemplate(day, prefs, []); plan.tasks[1].done = true;
  const original = '  ' + JSON.stringify({ schemaVersion: 1, revision: 7, preferences: prefs, days: { [day]: plan } }, null, 1) + '\n';
  await mkdir(join(root, 'store'), { recursive: true });
  await writeFile(join(root, '.dsh-daily-learning.json'), JSON.stringify({ owner: 'dsh-daily-learning', version: 1 }));
  await writeFile(stateFile, original); await writeFile(originalFile, original);
  await writeFile(join(profile, 'cordis.patch.yml'), `- id: dsh-daily-learning\n  config:\n    dataRoot: ${root.replaceAll('\\', '/')}\n    model:\n      provider: daily-test\n      model: memo-fixture\n    autoPrepareOnOpen: false\n`);
  const helper = (await readFile('scripts/dev-entry.mjs', 'utf8')).replace("new URL('../.test-runtime/fixture-calls.json', import.meta.url)", "new URL('./upgrade-fixture-calls.json', import.meta.url)");
  await writeFile(resolve('.test-runtime/upgrade-dev-entry.mjs'), helper);
  const overlay = (await readFile('scripts/dev.patch.yml', 'utf8')).replace(/name: .*\/scripts\/dev-entry\.mjs/, `name: ${resolve('.test-runtime/upgrade-dev-entry.mjs').replaceAll('\\', '/')}`);
  await writeFile(resolve('.test-runtime/upgrade-dev.patch.yml'), overlay);
  await writeFile(reportFile, JSON.stringify({ profile: 'daily-learning-upgrade', port: 31304, dataRoot: root, originalSha256: digest(Buffer.from(original)) }, null, 2));
  console.log('Seeded isolated schema 1: custom role/project, LLM completed, revision 7.');
} else if (mode === 'old' || mode === 'new') {
  const base = 'http://127.0.0.1:31304';
  const entry = await fetch(`${base}/daily-test-entry`, { redirect: 'manual' });
  assert.equal(entry.status, 302);
  const authUrl = new URL(entry.headers.get('location'));
  assert.equal(authUrl.origin, base);
  const exchange = await fetch(authUrl, { redirect: 'manual' });
  const cookie = exchange.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie);
  const response = await fetch(`${base}/daily-learning/state`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: 'state', payload: {} }) });
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.result.ok, true);
  const snapshot = envelope.result.value;
  const state = snapshot.state;
  const original = await readFile(originalFile), before = JSON.parse(original);
  assert.equal(state.schemaVersion, mode === 'old' ? 1 : 2); assert.equal(state.revision, 7);
  assert.equal(state.preferences.roles.llm, before.preferences.roles.llm); assert.equal(state.preferences.project, before.preferences.project);
  assert.deepEqual(state.days, before.days); assert.equal(state.days[day].tasks[1].done, true);
  assert.equal(await exists(countFile), false, 'Authenticated reads must not invoke model preparation');
  const installed = JSON.parse(await readFile(join(profile, 'node_modules/dsh-daily-learning/package.json')));
  assert.equal(installed.version, mode === 'old' ? '0.1.0' : '0.2.0');
  const evidence = { installedVersion: installed.version, schemaVersion: state.schemaVersion, revision: state.revision, completedLLM: true, roleProjectPreserved: true, modelCalls: 0 };
  if (mode === 'old') assert.deepEqual(await readFile(stateFile), original);
  else {
    const empty = Object.fromEntries(['algorithm', 'llm', 'agent', 'explore'].map(c => [c, { activeId: null, versions: [] }]));
    assert.deepEqual(state.routes, empty); assert.deepEqual(state.preferences.learningRequests, Object.fromEntries(Object.keys(empty).map(c => [c, ''])));
    const backups = (await readdir(join(root, 'backups'))).filter(n => /^state-v1-before-0\.2\.0-.*\.json$/.test(n)); assert.equal(backups.length, 1);
    const backup = await readFile(join(root, 'backups', backups[0])); assert.deepEqual(backup, original);
    evidence.backupFile = backups[0]; evidence.backupSha256 = digest(backup); evidence.emptyRoutes = true;
  }
  const report = JSON.parse(await readFile(reportFile)); report[mode] = evidence; await writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(`Passed actual DSH ${installed.version}: schema ${state.schemaVersion}, revision 7, old tasks/role/project preserved, zero model calls${mode === 'new' ? ', empty routes and exact-byte upgrade backup' : ''}.`);
} else throw new Error('Usage: node scripts/verify-upgrade-routes.mjs seed|old|new');
