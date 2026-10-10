import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, validatePreferences, makeTemplate, promptFor } from '../src/domain.ts';
import { emptyRouteBook, parseRouteOutput, routePosition, validateRouteBook, activeRoute, budgetFor, validateLearningContext, requestChanged, budgetChanged } from '../src/learning.ts';

const categories = ['algorithm', 'llm', 'agent', 'explore'];
const output = () => ({ goal: '理解注意力', assumptions: ['未提供基础'], stages: [{ title: 'QKV', goal: '解释三个向量', estimatedDays: 2, focus: ['手算'], searchTerms: ['Attention QKV'] }, { title: 'Attention 实验', goal: '完成实验', estimatedDays: 1, focus: [], searchTerms: [] }] });
export const routeFixture = () => parseRouteOutput(JSON.stringify(output()), 'llm', '原来的 Attention 需求', { minMinutes: 30, maxMinutes: 30 }, { id: 'r1', createdAt: '2026-10-10T00:00:00Z' });
const context = (route, stageId = 's1') => ({ routeId: route.id, stageId, request: route.request, routeGoal: route.goal, stageTitle: route.stages.find(s => s.id === stageId).title, stageGoal: route.stages.find(s => s.id === stageId).goal, review: false });
const planFixture = (date, route, stageId, done) => { const plan = makeTemplate(date, defaults()); Object.assign(plan.tasks[1], { learning: context(route, stageId), done }); return plan; };
test('legacy preferences default requests while preserving long Chinese Markdown', () => {
  const legacy = defaults(); delete legacy.learningRequests;
  assert.deepEqual(validatePreferences(legacy).learningRequests, Object.fromEntries(categories.map(c => [c, ''])));
  const prefs = defaults(); prefs.learningRequests.llm = '\n# 学习 Attention\n'.repeat(300);
  assert.equal(validatePreferences(prefs).learningRequests.llm, prefs.learningRequests.llm.trim());
  for (const bad of [[], { llm: 123 }, { unknown: '' }, { llm: '学'.repeat(12001) }]) assert.throws(() => validatePreferences({ ...prefs, learningRequests: bad }));
});
test('route parser assigns local identities and rejects model metadata or URLs', () => {
  const route = routeFixture(); assert.deepEqual(route.stages.map(s => s.id), ['s1', 's2']);
  assert.equal(parseRouteOutput('```json\n' + JSON.stringify(output()) + '\n```', 'llm', route.request, route.budget, { id: 'r2', createdAt: route.createdAt }).id, 'r2');
  for (const bad of [{ ...output(), id: 'fake' }, { ...output(), goal: 'https://example.com' }, { ...output(), stages: [] }, { ...output(), stages: [{ ...output().stages[0], id: 'bad' }] }, { ...output(), stages: [{ ...output().stages[0], estimatedDays: 1.5 }] }, { ...output(), stages: [{ ...output().stages[0], searchTerms: ['www.example.com'] }] }]) assert.throws(() => parseRouteOutput(JSON.stringify(bad), 'llm', route.request, route.budget, { id: 'r1', createdAt: route.createdAt }));
  assert.throws(() => parseRouteOutput('{}', 'unknown', route.request, route.budget, { id: 'r1', createdAt: route.createdAt }));
});
test('model URL rejection includes noncanonical and protocol-relative URLs but preserves user request', () => {
  const route = routeFixture();
  const parse = (goal, request = route.request) => parseRouteOutput(JSON.stringify({ ...output(), goal }), 'llm', request, route.budget, { id: 'r1', createdAt: route.createdAt });
  for (const goal of ['参考 https:example.com/path', '参考 //example.com/path', '//example.com']) assert.throws(() => parse(goal));
  assert.equal(parse('Q: 解释注意力', '阅读 https:example.com/path 和 //example.com/path').request, '阅读 https:example.com/path 和 //example.com/path');
});
test('route validation enforces every size boundary without truncation', () => {
  const route = routeFixture();
  const parse = raw => parseRouteOutput(JSON.stringify(raw), 'llm', route.request, route.budget, { id: route.id, createdAt: route.createdAt });
  for (const [key, value] of [['goal', '学'.repeat(2001)], ['assumptions', Array(13).fill('基础')], ['assumptions', ['学'.repeat(601)]], ['stages', Array(61).fill(output().stages[0])]]) assert.throws(() => parse({ ...output(), [key]: value }));
  for (const [key, value] of [['title', '学'.repeat(181)], ['goal', '学'.repeat(1201)], ['estimatedDays', 0], ['estimatedDays', 366], ['focus', Array(9).fill('学')], ['focus', ['学'.repeat(301)]], ['searchTerms', Array(9).fill('学')], ['searchTerms', ['学'.repeat(101)]]]) assert.throws(() => parse({ ...output(), stages: [{ ...output().stages[0], [key]: value }] }));
});
test('persisted validation preserves stage IDs and rejects invalid references', () => {
  const route = routeFixture(); route.stages[0].id = 'stage-old';
  const book = emptyRouteBook(); book.llm = { activeId: route.id, versions: [route] };
  assert.equal(validateRouteBook(book).llm.versions[0].stages[0].id, 'stage-old'); assert.equal(activeRoute(book, 'llm').id, route.id);
  for (const mutate of [b => b.llm.activeId = 'missing', b => b.llm.versions.push(route), b => b.llm.versions[0].category = 'agent', b => b.llm.versions[0].id = '../escape', b => b.llm.versions[0].stages[1].id = 'stage-old']) { const bad = structuredClone(book); mutate(bad); assert.throws(() => validateRouteBook(bad)); }
  assert.deepEqual(validateLearningContext(context(route, 'stage-old')), context(route, 'stage-old'));
  assert.throws(() => validateLearningContext({ ...context(route, 'stage-old'), review: 'yes' }));
});
test('progress counts distinct completed dates before planning day and reverses unchecks', () => {
  const route = routeFixture(), first = planFixture('2026-10-10', route, 's1', true), second = planFixture('2026-10-11', route, 's1', false);
  assert.equal(routePosition(route, [first, second], '2026-10-12').stage.id, 's1');
  second.tasks[1].done = true;
  assert.equal(routePosition(route, [first, first, second], '2026-10-12').stage.id, 's2');
  first.tasks[1].done = false;
  assert.equal(routePosition(route, [first, second], '2026-10-12').stage.id, 's1');
  assert.equal(routePosition(route, [second], '2026-10-11').completedDays, 0);
  const old = structuredClone(second); old.tasks[1].learning.routeId = 'old';
  assert.equal(routePosition(route, [old], '2026-10-12').completedDays, 0);
  first.tasks[1].done = true;
  const last = planFixture('2026-10-12', route, 's2', true);
  assert.deepEqual(routePosition(route, [first, second, last], '2026-10-13'), { stage: route.stages[1], completedDays: 1, complete: true });
});
test('custom template and historical prompt retain route context and current budgets', () => {
  const prefs = defaults(), route = routeFixture(), book = emptyRouteBook(); book.llm = { activeId: route.id, versions: [route] }; prefs.learningRequests.llm = route.request;
  const task = makeTemplate('2026-10-10', prefs, [], [], book).tasks[1];
  assert.match(task.title, /QKV/); assert.equal(task.learning.stageId, 's1'); assert.equal(task.topicIndex, undefined);
  assert.match(task.summary, /解释三个向量/);
  prefs.learningRequests.llm = '改学推理部署'; prefs.llmMinutes = 45;
  assert.match(promptFor(task, prefs), /原来的 Attention 需求/); assert.doesNotMatch(promptFor(task, prefs), /改学推理部署/);
  assert.equal(makeTemplate('2026-10-11', prefs, [], [], book).tasks[1].minutes, '45');
  assert.deepEqual(budgetFor(prefs, 'agent'), { minMinutes: 60, maxMinutes: 120 }); assert.equal(requestChanged(prefs, route), true); assert.equal(budgetChanged(prefs, route), true);
  const history = [planFixture('2026-10-10', route, 's1', true), planFixture('2026-10-11', route, 's1', true), planFixture('2026-10-12', route, 's2', true)];
  const review = makeTemplate('2026-10-13', prefs, history, [], book).tasks[1]; assert.match(review.title, /复习|综合实践/); assert.equal(review.learning.review, true);
});
