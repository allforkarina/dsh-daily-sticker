import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaults, makeTemplate } from '../src/domain.ts';
import * as sourceSelection from '../src/sources.ts';

const date = '2026-10-10';
const signal = () => new AbortController().signal;
const entry = (slug, level = 1, paid = false) => ({ stat: { question__title_slug: slug, question__title: `Verified ${slug}` }, difficulty: { level }, paid_only: paid });
const poolFetch = async () => ({ stat_status_pairs: [entry('two-sum'), entry('valid-parentheses', 2), entry('hard-topic', 3), entry('paid-topic', 1, true)] });
const focus = { searchTerms: ['stack', '括号'], title: '栈练习', minutes: '30' };
function routeBook(category, id = 'route-1') {
  const route = { id, category, createdAt: '2026-10-10T00:00:00Z', request: '阶段练习', budget: { minMinutes: 30, maxMinutes: 30 }, goal: '阶段学习', assumptions: [], stages: [
    { id: 's1', title: '原方向', goal: '第一阶段', estimatedDays: 1, focus: [], searchTerms: ['old-stage'] },
    { id: 's2', title: '新方向', goal: '第二阶段', estimatedDays: 2, focus: [], searchTerms: ['KV Cache'] }
  ] };
  return Object.fromEntries(['algorithm', 'llm', 'agent', 'explore'].map(c => [c, { activeId: c === category ? id : null, versions: c === category ? [route] : [] }]));
}

 test('article searches prefer stage keywords and include stage title and current budget', async () => {
  const queries = [];
  const prefs = { ...defaults(), interests: 'unrelated-old-interest' };
  await sourceSelection.collectArticles({ search: async ({ query }) => { queries.push(query); return { sources: [] }; } }, prefs, date, signal(), { searchTerms: ['KV Cache', '推理优化'], title: '推理部署', minutes: '25' });
  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.match(query, /KV Cache/);
    assert.match(query, /推理优化/);
    assert.match(query, /推理部署/);
    assert.match(query, /25/);
    assert.doesNotMatch(query, /unrelated-old-interest/);
  }
});

test('custom algorithm selects official search slug only after metadata cross-check', async () => {
  assert.equal(typeof sourceSelection.getProblem, 'function');
  let query;
  const web = { search: async input => { query = input.query; return { sources: [{ url: 'https://leetcode.cn/problems/valid-parentheses/', title: 'Invented search title', difficulty: 'Hard' }] }; } };
  const selected = await sourceSelection.getProblem(defaults(), [], signal(), web, focus, poolFetch);
  assert.equal(selected.slug, 'valid-parentheses');
  assert.equal(selected.title, 'Verified valid-parentheses');
  assert.equal(selected.difficulty, 'Medium');
  assert.equal(selected.topicMatched, true);
  assert.match(query, /site:leetcode.cn\/problems\//);
  assert.match(query, /stack/);
});

test('custom algorithm rejects fake, paid, hard and noncanonical official links', async () => {
  assert.equal(typeof sourceSelection.getProblem, 'function');
  const urls = ['https://leetcode.cn/problems/invented-slug/', 'https://leetcode.cn/problems/hard-topic/', 'https://leetcode.cn/problems/paid-topic/', 'https://example.org/problems/valid-parentheses/', 'https://leetcode.com/problems/valid-parentheses/', 'http://leetcode.cn/problems/valid-parentheses/', 'https://leetcode.cn.evil.org/problems/valid-parentheses/', 'https://user@leetcode.cn/problems/valid-parentheses/', 'https://leetcode.cn/problems/valid-parentheses/?redirect=evil'];
  const web = { search: async () => ({ sources: urls.map(url => ({ url })) }) };
  const selected = await sourceSelection.getProblem(defaults(), [], signal(), web, focus, poolFetch);
  assert.equal(selected.verified, true);
  assert.equal(selected.topicMatched, false);
  assert.ok(['two-sum', 'valid-parentheses'].includes(selected.slug));
});

test('failed custom algorithm search returns a verified generic source with mismatch metadata', async () => {
  assert.equal(typeof sourceSelection.getProblem, 'function');
  const selected = await sourceSelection.getProblem(defaults(), [], signal(), { search: async () => { throw new Error('offline'); } }, focus, poolFetch);
  assert.equal(selected.topicMatched, false);
  assert.equal(selected.verified, true);
});

test('source collection derives current stage from full history older than dedup window', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-sources-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ stat_status_pairs: [] }), { status: 200 }));
  const routes = routeBook('explore');
  const old = makeTemplate('2026-08-01', defaults());
  old.tasks[3].done = true;
  old.tasks[3].learning = { routeId: 'route-1', stageId: 's1' };
  const queries = [];
  await sourceSelection.collectSources(root, { search: async ({ query }) => { queries.push(query); return { sources: [] }; } }, defaults(), date, [old], signal(), routes);
  assert.match(queries.join('\n'), /KV Cache/);
  assert.doesNotMatch(queries.join('\n'), /old-stage/);
});

test('updated explore route cannot recover article cache from previous direction', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  await mkdir(join(root, 'cache'));
  await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, sources: [{ id: 'article:0', title: 'Old direction', url: 'https://example.org/old', fetchedAt: '2026-10-09T00:00:00Z', verified: true }], exploreKey: JSON.stringify({ routeId: 'route-old', stageId: 's1' }) }));
  const sources = await sourceSelection.collectSources(root, { search: async () => { throw new Error('offline'); } }, prefs, date, [], signal(), routeBook('explore', 'route-new'));
  assert.equal(sources.length, 0);
});

test('matching route cache recovers verified fallback and preserves mismatch notice metadata', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  const cached = { id: 'problem:cn:two-sum', slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.cn/problems/two-sum/', fetchedAt: '2026-10-09T00:00:00Z', verified: true, topicMatched: false };
  await mkdir(join(root, 'cache'));
  await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, sources: [cached], algorithmKey: JSON.stringify({ routeId: 'route-1', stageId: 's1' }) }));
  const sources = await sourceSelection.collectSources(root, null, prefs, date, [], signal(), routeBook('algorithm'));
  assert.equal(sources.length, 1);
  assert.equal(sources[0].topicMatched, false);
  const saved = JSON.parse(await readFile(join(root, 'cache', 'sources.json'), 'utf8'));
  assert.equal(saved.algorithmKey, JSON.stringify({ routeId: 'route-1', stageId: 's1' }));
});

test('legacy source caches remain available when no custom route is active', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  await mkdir(join(root, 'cache'));
  await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, sources: [{ id: 'article:0', title: 'Default cached article', url: 'https://example.org/default', fetchedAt: '2026-10-09T00:00:00Z', verified: true }] }));
  const sources = await sourceSelection.collectSources(root, null, prefs, date, [], signal());
  assert.equal(sources[0].title, 'Default cached article');
});

test('same-day cached algorithm source is still excluded during explicit replanning', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  const cached = { id: 'problem:cn:two-sum', slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.cn/problems/two-sum/', fetchedAt: '2026-10-09T00:00:00Z', verified: true };
  const today = makeTemplate(date, prefs, [], [cached]);
  await mkdir(join(root, 'cache'));
  await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, sources: [cached] }));
  const sources = await sourceSelection.collectSources(root, null, prefs, date, [today], signal());
  assert.equal(sources.length, 0);
});

test('article search widens to 30 days when the same source was outside seven days', async () => {
  let searches = 0, reads = 0;
  const sources = await sourceSelection.collectArticles({
    search: async () => { searches++; return { sources: [{ url: 'https://example.org/eight-days', title: 'Relevant stage article', publishedAt: '2026-10-02' }] }; },
    fetch: async ({ url }) => { reads++; return { url, statusCode: 200, body: { content: 'Original publication with sufficient body text. '.repeat(8) } }; }
  }, defaults(), date, signal(), { searchTerms: ['Attention'] });
  assert.equal(searches, 2);
  assert.equal(reads, 1);
  assert.equal(sources[0].publishedAt, '2026-10-02');
});

test('route cache refuses stale or future publications and unverified unknown dates', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-dates-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  await mkdir(join(root, 'cache'));
  const base = { id: 'article:0', title: 'Cached stage article', url: 'https://example.org/cached', verified: true, fetchedAt: '2026-10-09T00:00:00Z' };
  const invalid = [
    { publishedAt: '2020-01-01' },
    { publishedAt: '2026-10-11' },
    { publishedAt: 'not-a-date' },
    { fetchedAt: '2026-08-01T00:00:00Z' },
    { fetchedAt: '2026-10-11T00:00:00Z' },
    { fetchedAt: 'not-a-date' },
    { verified: false }
  ];
  for (const fields of invalid) {
    await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, exploreKey: JSON.stringify({ routeId: 'route-1', stageId: 's1' }), sources: [{ ...base, ...fields }] }));
    const sources = await sourceSelection.collectSources(root, null, prefs, date, [], signal(), routeBook('explore'));
    assert.deepEqual(sources, [], `cache must reject ${JSON.stringify(fields)}`);
  }
});

test('route cache retains fresh known and unknown dates without replacing retrieval provenance', async t => {
  const root = await mkdtemp(join(tmpdir(), 'learning-cache-dates-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const prefs = defaults();
  await mkdir(join(root, 'cache'));
  const entries = [
    { id: 'article:0', title: 'Known publication', url: 'https://example.org/known', verified: true, fetchedAt: '2026-09-25T00:00:00Z', publishedAt: '2026-09-20' },
    { id: 'article:1', title: 'Unknown publication', url: 'https://example.org/unknown', verified: true, fetchedAt: '2026-10-09T00:00:00Z' }
  ];
  await writeFile(join(root, 'cache', 'sources.json'), JSON.stringify({ site: prefs.leetcodeSite, interests: prefs.interests, exploreKey: JSON.stringify({ routeId: 'route-1', stageId: 's1' }), sources: entries }));
  const sources = await sourceSelection.collectSources(root, null, prefs, date, [], signal(), routeBook('explore'));
  assert.deepEqual(sources, entries);
  assert.equal(sources[1].publishedAt, undefined);
  assert.equal(makeTemplate(date, prefs, [], sources).tasks[3].sources[1].publishedAt, undefined);
  const saved = JSON.parse(await readFile(join(root, 'cache', 'sources.json'), 'utf8'));
  assert.deepEqual(saved.sources, entries);
});

test('fresh article search rejects a publication after the planning date', async () => {
  let reads = 0;
  const sources = await sourceSelection.collectArticles({
    search: async () => ({ sources: [{ url: 'https://example.org/future', title: 'Future publication', publishedAt: '2026-10-11' }] }),
    fetch: async ({ url }) => { reads++; return { url, statusCode: 200, body: { content: 'Original source body. '.repeat(8) } }; }
  }, defaults(), date, signal());
  assert.deepEqual(sources, []);
  assert.equal(reads, 0);
});

test('fresh article search includes the full advertised earliest day in its 30-day window', async () => {
  const sources = await sourceSelection.collectArticles({
    search: async () => ({ sources: [{ url: 'https://example.org/boundary', title: 'Window boundary publication', publishedAt: '2026-09-10' }] }),
    fetch: async ({ url }) => ({ url, statusCode: 200, body: { content: 'Original source body. '.repeat(8) } })
  }, defaults(), date, signal());
  assert.equal(sources.length, 1);
  assert.equal(sources[0].publishedAt, '2026-09-10');
});
