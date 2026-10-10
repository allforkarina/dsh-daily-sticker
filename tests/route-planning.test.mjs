import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LocalStore } from '../src/store.ts';
import { DailyService } from '../src/service.ts';
import { makeTemplate } from '../src/domain.ts';
import { routePosition } from '../src/learning.ts';

const module = await import('../src/route-planner.ts').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const identity = { id: 'r-test', createdAt: '2026-10-10T00:00:00Z' };
const output = { goal: '理解注意力并做实验', assumptions: ['未提供期限'], stages: [
  { title: 'QKV', goal: '解释三个向量', estimatedDays: 2, focus: ['手算例子'], searchTerms: ['Attention QKV'] }
] };
const input = () => ({ category: 'llm', request: '想学习 Attention，偏手算与实验。\n'.repeat(120), budget: { minMinutes: 30, maxMinutes: 30 }, previous: null, recentCompleted: [], identity });
test('model extracts a route from full request and receives budget and local identity', async () => {
  assert.equal(typeof module.generateRoute, 'function', 'route generation is implemented');
  let captured;
  const route = await module.generateRoute(input(), { generate: async (system, text) => { captured = JSON.parse(text); assert.match(system, /掌握/); return JSON.stringify(output); } });
  assert.equal(captured.kind, 'route');
  assert.equal(captured.request, input().request);
  assert.deepEqual(captured.budget, input().budget);
  assert.equal(route.id, identity.id);
  assert.equal(route.stages[0].id, 's1');
});
test('invalid route output repairs once and then rejects instead of replacing with a template', async () => {
  assert.equal(typeof module.generateRoute, 'function');
  let calls = 0;
  await assert.rejects(module.generateRoute(input(), { generate: async () => { calls++; return '{bad'; } }), /路线/);
  assert.equal(calls, 2);
});
test('route generation cancels a noncooperative model', async () => {
  assert.equal(typeof module.generateRoute, 'function');
  const controller = new AbortController();
  const pending = module.generateRoute(input(), { signal: controller.signal, generate: () => new Promise(() => {}) });
  setTimeout(() => controller.abort(), 10);
  await assert.rejects(pending, /abort/i);
});
async function setup(generator) {
  const store = await LocalStore.open(await mkdtemp(join(tmpdir(), 'dsh-route-test-')));
  const service = new DailyService(store, async (date, prefs, history) => makeTemplate(date, prefs, history), () => new Date('2026-10-10T02:00:00Z'), generator);
  const state = await store.read();
  state.preferences.learningRequests.llm = '原来的 Attention 需求';
  await store.commit(state.revision, state);
  return { store, service };
}
const routeFor = payload => ({ ...identity, category: payload.category, request: payload.request, budget: payload.budget, goal: output.goal, assumptions: output.assumptions, stages: output.stages.map((s, i) => ({ ...s, id: `s${i+1}` })) });
test('service activates a new route, retains old versions and clears activation only when request cleared', async () => {
  assert.equal(typeof DailyService.prototype.generateRoute, 'function');
  let i = 0;
  const { store, service } = await setup(async payload => ({ ...routeFor(payload), id: `r-${++i}` }));
  try {
    await service.generateRoute('llm', 1);
    let state = await store.read();
    assert.equal(state.routes.llm.activeId, 'r-1');
    assert.equal(state.routes.agent.activeId, null);
    await service.generateRoute('llm', state.revision);
    state = await store.read();
    assert.equal(state.routes.llm.versions.length, 2);
    await service.preferences({ ...state.preferences, learningRequests: { ...state.preferences.learningRequests, llm: '改为推理部署' } }, state.revision);
    state = await store.read();
    assert.equal(state.routes.llm.activeId, 'r-2');
    await service.preferences({ ...state.preferences, learningRequests: { ...state.preferences.learningRequests, llm: '' } }, state.revision);
    state = await store.read();
    assert.equal(state.routes.llm.activeId, null);
    assert.equal(state.routes.llm.versions.length, 2);
  } finally { await store.close(); }
});
test('route result cannot overwrite changed requirements and concurrent requests cannot duplicate calls', async () => {
  assert.equal(typeof DailyService.prototype.generateRoute, 'function');
  let release, entered, calls = 0;
  const started = new Promise(r => entered = r);
  const { store, service } = await setup(async payload => { calls++; entered(); await new Promise(r => release = r); return routeFor(payload); });
  try {
    const pending = service.generateRoute('llm', 1);
    await started;
    await assert.rejects(service.generateRoute('llm', 1), /进行|生成/);
    const state = await store.read();
    await service.preferences({ ...state.preferences, learningRequests: { ...state.preferences.learningRequests, llm: '新需求' } }, state.revision);
    release();
    await assert.rejects(pending, /冲突/);
    const saved = await store.read();
    assert.equal(saved.preferences.learningRequests.llm, '新需求');
    assert.equal(saved.routes.llm.activeId, null);
    assert.equal(calls, 1);
    assert.equal((await service.snapshot()).routeGenerating, null);
  } finally { await store.close(); }
});
test('failed generation preserves the previously active route and missing model is explicit', async () => {
  assert.equal(typeof DailyService.prototype.generateRoute, 'function');
  let fail = false;
  const { store, service } = await setup(async payload => { if (fail) throw new Error('模型路线失败'); return routeFor(payload); });
  try {
    await service.generateRoute('llm', 1);
    const before = await store.read(); fail = true;
    await assert.rejects(service.generateRoute('llm', before.revision), /失败/);
    assert.deepEqual(await store.read(), before);
    const noModel = new DailyService(store, async () => {}, () => new Date());
    await assert.rejects(noModel.generateRoute('llm', before.revision), /模型/);
  } finally { await store.close(); }
});

test('service keeps full history for stage progress beyond thirty days', async () => {
  const {store, service} = await setup(async payload => routeFor(payload));
  try {
    await service.generateRoute('llm', 1);
    const state = await store.read();
    const route = state.routes.llm.versions[0];
    route.stages[0].estimatedDays = 35;
    route.stages.push({...route.stages[0], id:'s2',title:'Attention实验',estimatedDays:1});
    for (let i=0;i<35;i++) {
      const date = new Date(Date.UTC(2026,7,1+i)).toISOString().slice(0,10);
      state.days[date] = makeTemplate(date,state.preferences,[],[],state.routes);
      state.days[date].tasks[1].done = true;
    }
    await store.commit(state.revision,state);
    service.planner = async (date,prefs,history,routes) => {
      assert.equal(history.length,35);
      assert.equal(routePosition(routes.llm.versions[0],history,date).stage.id,'s2');
      return makeTemplate(date,prefs,history,[],routes);
    };
    await service.prepare(false);
    assert.equal((await store.read()).days['2026-10-10'].tasks[1].learning.stageId,'s2');
  } finally {await store.close();}
});

test('activating a new route keeps completed same-day task and its old prompt context', async () => {
  let count=0;
  const {store,service} = await setup(async payload => ({...routeFor(payload),id:`r-${++count}`}));
  service.planner = async (date,prefs,history,routes) => makeTemplate(date,prefs,history,[],routes);
  try {
    await service.generateRoute('llm',1);
    await service.prepare(false);
    let state=await store.read();
    await service.check('2026-10-10','llm',true,state.revision);
    state=await store.read();
    const previous=structuredClone(state.days['2026-10-10'].tasks[1]);
    await service.preferences({...state.preferences,learningRequests:{...state.preferences.learningRequests,llm:'改学推理部署'}},state.revision);
    state=await store.read();
    await service.generateRoute('llm',state.revision);
    await service.prepare(true);
    state=await store.read();
    assert.equal(state.routes.llm.activeId,'r-2');
    assert.deepEqual(state.days['2026-10-10'].tasks[1],previous);
    service.now=()=>new Date('2026-10-11T02:00:00Z');
    await service.prepare(false);
    assert.equal((await store.read()).days['2026-10-11'].tasks[1].learning.routeId,'r-2');
  } finally {await store.close();}
});

test('prepare responses describe the completed operation rather than leaving UI preparing', async () => {
  const {store,service}=await setup(async payload=>routeFor(payload));
  try {
    const [first,second]=await Promise.all([service.prepare(false),service.prepare(false)]);
    assert.equal(first.preparing,false);
    assert.equal(second.preparing,false);
    assert.equal(first.state.revision,2);
    assert.equal((await service.prepare(false)).preparing,false);
  } finally {await store.close();}
});
