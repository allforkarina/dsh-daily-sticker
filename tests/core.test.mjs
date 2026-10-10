import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defaults, makeTemplate, promptFor, dateInZone, validatePreferences, validateCandidate, enteredDate } from '../src/domain.ts';
import { LocalStore } from '../src/store.ts';
import { DailyService } from '../src/service.ts';

const day = '2026-10-09';
const temporary = () => mkdtemp(join(tmpdir(), 'dsh-daily-test-'));
test('re-entering follows a new today while preserving an intentionally selected historical date', () => {
  assert.equal(enteredDate('2026-10-08', '2026-10-08', day), day);
  assert.equal(enteredDate('2026-10-07', '2026-10-08', day), '2026-10-07');
});
test('four memo tasks use independent budgets and need no progress record', () => {
  const plan = makeTemplate(day, defaults(), []);
  assert.deepEqual(plan.tasks.map(t => t.category), ['algorithm', 'llm', 'agent', 'explore']);
  assert.deepEqual(plan.tasks.map(t => t.minutes), ['30', '30', '60–120', '25']);
  assert.ok(plan.tasks.every(t => t.done === false && !('progress' in t)));
  assert.match(plan.tasks[2].title, /工具调用/);
});
test('date uses selected zone across midnight', () => {
  assert.equal(dateInZone(new Date('2026-10-08T16:01:00Z'), 'Asia/Shanghai'), day);
  assert.equal(dateInZone(new Date('2026-10-08T16:01:00Z'), 'UTC'), '2026-10-08');
});
test('preferences reject hidden file operations and unreasonable budgets', () => {
  assert.throws(() => validatePreferences({ ...defaults(), arbitraryPath: 'C:/' }));
  assert.throws(() => validatePreferences({ ...defaults(), algorithmMinutes: -1 }));
  assert.throws(() => validatePreferences({ ...defaults(), timezone: 'invalid-zone' }));
});
test('copy prompt contains role/goal and leaves task unchanged', () => {
  const task = makeTemplate(day, defaults(), []).tasks[1];
  const before = structuredClone(task);
  assert.match(promptFor(task, defaults()), /苏格拉底/);
  assert.match(promptFor(task, defaults()), /30/);
  assert.deepEqual(task, before);
});
test('changing LLM starting topic applies to the next plan without editing old day', () => {
  const prefs = defaults();
  const previous = makeTemplate('2026-10-08', prefs, []);
  const next = makeTemplate(day, { ...prefs, llmStart: 5 }, [previous]);
  assert.equal(next.tasks[1].topicIndex, 5);
  assert.equal(previous.tasks[1].topicIndex, 0);
});
test('saved plans keep source metadata without copying full retrieved pages', () => {
  const source = { id: 'article:0', verified: true, title: '资料', url: 'https://arxiv.org/abs/example', fetchedAt: '2026-10-09T00:00:00Z', text: 'a'.repeat(12000) };
  const plan = makeTemplate(day, defaults(), [], [source]);
  assert.equal(plan.tasks[3].sources[0].text, undefined);
});
test('model candidate cannot supply invented source urls or change category identity', () => {
  const base = makeTemplate(day, defaults(), []);
  const candidate = { tasks: base.tasks.map(t => ({ category: t.category, title: t.title, summary: t.summary, steps: t.steps, acceptance: t.acceptance, sourceIds: [] })) };
  candidate.tasks[0].sources = [{ url: 'https://fake.example/' }];
  assert.throws(() => validateCandidate(candidate, base, []));
  delete candidate.tasks[0].sources;
  candidate.tasks[1].category = 'algorithm';
  assert.throws(() => validateCandidate(candidate, base, []));
});
test('state survives reopen and markdown snapshot reflects checkbox', async () => {
  const root = await temporary();
  const store = await LocalStore.open(root);
  let state = await store.read();
  state.days[day] = makeTemplate(day, defaults(), []);
  state.days[day].tasks[0].done = true;
  await store.commit(0, state);
  await store.close();
  const reopened = await LocalStore.open(root);
  assert.equal((await reopened.read()).days[day].tasks[0].done, true);
  assert.match(await readFile(join(root, 'days', day, 'plan.md'), 'utf8'), /\[x\]/);
  await reopened.close();
});
test('stale revision rejects rather than overwriting committed data', async () => {
  const store = await LocalStore.open(await temporary());
  const state = await store.read();
  await store.commit(0, state);
  await assert.rejects(store.commit(0, state), /冲突/);
  assert.equal((await store.read()).revision, 1);
  await store.close();
});
test('unknown future schema preserves original state and refuses activation', async () => {
  const root = await temporary();
  const store = await LocalStore.open(root);
  await store.close();
  const file = join(root, 'store', 'state.json');
  const text = JSON.stringify({ schemaVersion: 99, revision: 1 });
  await writeFile(file, text);
  await assert.rejects(LocalStore.open(root), /版本/);
  assert.equal(await readFile(file, 'utf8'), text);
});
test('schema one migration backs up exact bytes and preserves legacy preferences and completion', async () => {
  const root = await temporary(), initial = await LocalStore.open(root);
  await initial.close();
  const prefs = defaults(); delete prefs.learningRequests; prefs.roles.llm = '旧角色'; prefs.project = '旧工程';
  const plan = makeTemplate(day, defaults()); plan.tasks[0].done = true;
  const original = '  ' + JSON.stringify({ schemaVersion: 1, revision: 9, preferences: prefs, days: { [day]: plan } }, null, 1) + '\n';
  const file = join(root, 'store', 'state.json'); await writeFile(file, original);
  const store = await LocalStore.open(root), migrated = await store.read();
  assert.equal(migrated.schemaVersion, 2); assert.equal(migrated.revision, 9);
  assert.equal(migrated.preferences.roles.llm, '旧角色'); assert.equal(migrated.preferences.project, '旧工程'); assert.equal(migrated.days[day].tasks[0].done, true);
  assert.equal(migrated.preferences.learningRequests.llm, ''); assert.deepEqual(migrated.routes.llm, { activeId: null, versions: [] });
  const backup = (await readdir(join(root, 'backups'))).find(n => /^state-v1-before-0\.2\.0-.*\.json$/.test(n)); assert.ok(backup);
  assert.equal(await readFile(join(root, 'backups', backup), 'utf8'), original); await store.close();
});
test('invalid legacy state is preserved without a migration backup', async () => {
  const root = await temporary(), initial = await LocalStore.open(root); await initial.close();
  const invalid = JSON.stringify({ schemaVersion: 1, revision: 0, preferences: defaults(), days: { bad: {} } });
  const file = join(root, 'store', 'state.json'); await writeFile(file, invalid);
  await assert.rejects(LocalStore.open(root)); assert.equal(await readFile(file, 'utf8'), invalid);
  assert.equal((await readdir(join(root, 'backups'))).filter(n => n.startsWith('state-v1-before')).length, 0);
});
test('unavailable migration backup leaves original bytes and releases writer lock', async () => {
  const root = await temporary(), initial = await LocalStore.open(root); await initial.close();
  const prefs = defaults(); delete prefs.learningRequests;
  const original = '  ' + JSON.stringify({ schemaVersion: 1, revision: 2, preferences: prefs, days: {} }) + '\n';
  const file = join(root, 'store', 'state.json'); await writeFile(file, original);
  await rename(join(root, 'backups'), join(root, 'backups-original'));
  await writeFile(join(root, 'backups'), 'unavailable directory');
  await assert.rejects(LocalStore.open(root));
  assert.equal(await readFile(file, 'utf8'), original);
  assert.equal((await readdir(root)).includes('.writer.lock'), false);
  await unlink(join(root, 'backups')); await rename(join(root, 'backups-original'), join(root, 'backups'));
  const reopened = await LocalStore.open(root); assert.equal((await reopened.read()).schemaVersion, 2); await reopened.close();
});
test('all route versions persist with Markdown snapshots and invalid task snapshots reject', async () => {
  const { parseRouteOutput } = await import('../src/learning.ts');
  const root = await temporary(), store = await LocalStore.open(root), state = await store.read();
  const route = parseRouteOutput(JSON.stringify({ goal: '目标', assumptions: ['基础未提供'], stages: [{ title: '阶段', goal: '阶段目标', estimatedDays: 2, focus: ['实践'], searchTerms: [] }] }), 'llm', '学习需求', { minMinutes: 30, maxMinutes: 30 }, { id: 'r1', createdAt: '2026-10-10T00:00:00Z' });
  state.routes.llm = { activeId: 'r2', versions: [route, { ...route, id: 'r2' }] };
  state.days[day] = makeTemplate(day, state.preferences, [], [], state.routes);
  await store.commit(0, state); await store.close();
  const reopened = await LocalStore.open(root), restored = await reopened.read();
  assert.deepEqual(restored.routes, state.routes); assert.equal(restored.days[day].tasks[1].learning.routeId, 'r2');
  assert.match(await readFile(join(root, 'routes', 'llm', 'r1.md'), 'utf8'), /学习需求/);
  assert.match(await readFile(join(root, 'routes', 'llm', 'r1.md'), 'utf8'), /30.*分钟/);
  restored.days[day].tasks[1].learning.review = 'yes'; await assert.rejects(reopened.commit(restored.revision, restored)); await reopened.close();
});
test('second host cannot activate the same root', async () => {
  const root = await temporary();
  const first = await LocalStore.open(root);
  await assert.rejects(LocalStore.open(root), /占用/);
  await first.close();
});
test('reads and existing-day preparation never call planner; same-day requests single-flight', async () => {
  const store = await LocalStore.open(await temporary());
  let calls = 0;
  const planner = async (date, prefs, history) => { calls++; await new Promise(r => setTimeout(r, 20)); return makeTemplate(date, prefs, history); };
  const service = new DailyService(store, planner, () => new Date('2026-10-09T02:00:00Z'));
  await service.snapshot();
  assert.equal(calls, 0);
  await Promise.all([service.prepare(false), service.prepare(false)]);
  assert.equal(calls, 1);
  await service.prepare(false);
  await service.snapshot();
  assert.equal(calls, 1);
  await store.close();
});
test('completion requires no learning record and does not invoke planner', async () => {
  const store = await LocalStore.open(await temporary());
  const service = new DailyService(store, async (date, prefs, history, routes) => makeTemplate(date, prefs, history, [], routes), () => new Date('2026-10-09T02:00:00Z'));
  await service.prepare(false);
  const { state } = await service.snapshot();
  await service.check(day, 'algorithm', true, state.revision);
  assert.equal((await service.snapshot()).state.days[day].tasks[0].done, true);
  await store.close();
});
test('late planning result cannot overwrite checkbox committed during replan', async () => {
  const store = await LocalStore.open(await temporary());
  let release;
  let calls = 0;
  const service = new DailyService(store, async (date, prefs, history, routes) => {
    calls++;
    if (calls === 2) await new Promise(r => { release = r; });
    return makeTemplate(date, prefs, history, [], routes);
  }, () => new Date('2026-10-09T02:00:00Z'));
  await service.prepare(false);
  const pending = service.prepare(true);
  while (!release) await new Promise(r => setTimeout(r, 1));
  const { state } = await service.snapshot();
  await service.check(day, 'llm', true, state.revision);
  release();
  await assert.rejects(pending, /冲突/);
  assert.equal((await service.snapshot()).state.days[day].tasks[1].done, true);
  await store.close();
});
