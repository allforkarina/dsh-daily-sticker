import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, makeTemplate } from '../src/domain.ts';
import { pickProblem, collectArticles } from '../src/sources.ts';
import { planDay, streamText } from '../src/planner.ts';

const problem = { id: 'problem:cn:two-sum', title: '两数之和', difficulty: 'Easy', slug: 'two-sum', verified: true, url: 'https://leetcode.cn/problems/two-sum/', fetchedAt: '2026-10-09T00:00:00Z' };
test('problem picker rejects hard/unknown and excludes completed recent problems', () => {
  const past = makeTemplate('2026-10-08', defaults(), [], [problem]);
  past.tasks[0].done = true;
  const medium = { ...problem, id: 'problem:cn:other', slug: 'other', difficulty: 'Medium' };
  assert.equal(pickProblem([problem, { ...problem, difficulty: 'Hard' }, medium], [past], () => 0).id, medium.id);
  assert.equal(pickProblem([{ ...problem, difficulty: 'Unknown' }], [], () => 0), null);
});
test('articles use fetched original body, reject stale date, mark unknown publication explicitly', async () => {
  const web = {
    search: async () => ({ sources: [
      { url: 'https://example.org/original', title: '研究与工具' },
      { url: 'https://example.org/old', title: '旧内容', publishedAt: '2020-01-01' }
    ] }),
    fetch: async ({ url }) => ({ url, statusCode: 200, body: { kind: 'text', content: '原始来源中足够完整的内容 '.repeat(30) } })
  };
  const sources = await collectArticles(web, defaults(), '2026-10-09', new AbortController().signal);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].publishedAt, undefined);
  assert.ok(sources[0].verified);
  assert.match(sources[0].text, /原始来源/);
});
test('stream collector uses final block once and treats terminal error as failure', async () => {
  async function* good() { yield { type: 'text-delta', index: 0, text: 'hello' }; yield { type: 'block-end', index: 0, block: { type: 'text', text: 'hello' } }; yield { type: 'finish', reason: { kind: 'stop' } }; }
  assert.equal(await streamText(good()), 'hello');
  async function* bad() { yield { type: 'finish', reason: { kind: 'error', failure: { message: '失败' } } }; }
  await assert.rejects(streamText(bad()), /失败/);
});
test('no model returns usable template with verified problem; invalid output repairs at most once', async () => {
  const sources = async () => [problem];
  const template = await planDay('2026-10-09', defaults(), [], { sources });
  assert.match(template.tasks[0].title, /两数之和/);
  let calls = 0;
  const degraded = await planDay('2026-10-09', defaults(), [], { sources, generate: async () => { calls++; return '{invalid'; } });
  assert.equal(calls, 2);
  assert.equal(degraded.mode, 'template');
  assert.ok(degraded.notices.length);
});
test('cancelled planning cannot degrade into a saved template', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(planDay('2026-10-09', defaults(), [], { sources: async () => [], signal: controller.signal }), /abort/i);
});
test('abort interrupts a source provider that ignores cancellation', async () => {
  const controller = new AbortController();
  const pending = planDay('2026-10-09', defaults(), [], { sources: () => new Promise(() => {}), signal: controller.signal });
  setTimeout(() => controller.abort(), 10);
  await assert.rejects(pending, /abort/i);
});

test('daily model receives the active route, keeps local stage identity and respects new budgets', async () => {
  const prefs = { ...defaults(), llmMinutes: 45 };
  const route = { id: 'r-1', category: 'llm', createdAt: '2026-10-10T00:00:00Z', request: '学习Attention，先手算', budget: {minMinutes:30,maxMinutes:30}, goal:'理解注意力', assumptions:[], stages:[{ id:'s1', title:'QKV', goal:'解释QKV', estimatedDays:2, focus:['手算'], searchTerms:['Attention QKV'] }] };
  const routes = Object.fromEntries(['algorithm','llm','agent','explore'].map(c => [c, {activeId: c === 'llm' ? route.id : null,versions:c === 'llm' ? [route] : []}]));
  let captured;
  const plan = await planDay('2026-10-10', prefs, [], { routes, sources: async () => [], generate: async (system, input) => {
    captured = JSON.parse(input);
    return JSON.stringify({tasks:captured.template.tasks.map(t => ({category:t.category,title:t.title,summary:t.summary,steps:t.steps,acceptance:t.acceptance,sourceIds:[]}))});
  }});
  assert.equal(captured.learningRoutes.llm.route.id, route.id);
  assert.match(plan.tasks[1].title, /QKV/);
  assert.equal(plan.tasks[1].minutes, '45');
  assert.equal(plan.tasks[1].learning.routeId, route.id);
});

test('failed daily model stays on custom stage instead of builtin Prompt route', async () => {
  const route = { id:'r-1',category:'llm',createdAt:'2026-10-10T00:00:00Z',request:'学Attention',budget:{minMinutes:30,maxMinutes:30},goal:'注意力',assumptions:[],stages:[{id:'s1',title:'QKV',goal:'解释QKV',estimatedDays:2,focus:['手算'],searchTerms:[]}] };
  const routes = Object.fromEntries(['algorithm','llm','agent','explore'].map(c => [c,{activeId:c === 'llm' ? route.id:null,versions:c === 'llm' ? [route]:[]}]));
  const plan = await planDay('2026-10-10', defaults(), [], {routes,sources:async()=>[],generate:async()=>{throw new Error('model unavailable');}});
  assert.match(plan.tasks[1].title,/QKV/);
  assert.equal(plan.mode,'template');
  assert.match(plan.notices.join('\n'), /模型/);
});
