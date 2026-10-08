import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
  const service = new DailyService(store, async (...args) => makeTemplate(...args), () => new Date('2026-10-09T02:00:00Z'));
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
  const service = new DailyService(store, async (...args) => {
    calls++;
    if (calls === 2) await new Promise(r => { release = r; });
    return makeTemplate(...args);
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
