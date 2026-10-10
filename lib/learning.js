








export const MAX_REQUEST_BYTES = 262144;
const learningCategories             = ['algorithm', 'llm', 'agent', 'explore'];
function routeKeys(value     , keys          ) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) throw new Error('路线含未知字段或格式不正确');
}
function routeText(value         , max        , name        , model = false)         {
  if (typeof value !== 'string' || !value.trim() || value.length > max || (model && /(?:\bhttps?:|\b[a-z][a-z0-9+.-]*:\/\/|\/\/[^\s/]+|\bwww\.)/i.test(value))) throw new Error(`${name}格式不正确或包含 URL`);
  return value.trim();
}
function routeId(value         )         {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value)) throw new Error('路线标识不正确');
  return value;
}
function routeList(value         , count        , max        , name        )           {
  if (!Array.isArray(value) || value.length > count) throw new Error(`${name}格式不正确`);
  return value.map(v => routeText(v, max, name, true));
}
function validateBudget(value     )         {
  routeKeys(value, ['minMinutes', 'maxMinutes']);
  if (![value.minMinutes, value.maxMinutes].every(v => Number.isInteger(v) && v >= 5 && v <= 240) || value.minMinutes > value.maxMinutes) throw new Error('路线预算不正确');
  return { minMinutes: value.minMinutes, maxMinutes: value.maxMinutes };
}
function validateStage(value     , id        , persisted = false)                {
  routeKeys(value, persisted ? ['id', 'title', 'goal', 'estimatedDays', 'focus', 'searchTerms'] : ['title', 'goal', 'estimatedDays', 'focus', 'searchTerms']);
  if (!Number.isInteger(value.estimatedDays) || value.estimatedDays < 1 || value.estimatedDays > 365) throw new Error('阶段预计天数须为 1–365 的整数');
  return { id: routeId(id), title: routeText(value.title, 180, '阶段标题', true), goal: routeText(value.goal, 1200, '阶段目标', true), estimatedDays: value.estimatedDays, focus: routeList(value.focus, 8, 300, '阶段重点'), searchTerms: routeList(value.searchTerms, 8, 100, '检索词') };
}
function validateRoute(value     )                {
  routeKeys(value, ['id', 'category', 'createdAt', 'request', 'budget', 'goal', 'assumptions', 'stages']);
  if (!learningCategories.includes(value.category)) throw new Error('路线类别不正确');
  const createdAt = routeText(value.createdAt, 100, '路线日期');
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('路线日期不正确');
  if (!Array.isArray(value.stages) || value.stages.length < 1 || value.stages.length > 60) throw new Error('路线须包含 1–60 个阶段');
  const stages = value.stages.map((s     ) => validateStage(s, s?.id, true));
  if (new Set(stages.map((s               ) => s.id)).size !== stages.length) throw new Error('阶段标识重复');
  return { id: routeId(value.id), category: value.category, createdAt, request: routeText(value.request, 12000, '学习需求'), budget: validateBudget(value.budget), goal: routeText(value.goal, 2000, '路线目标', true), assumptions: routeList(value.assumptions, 12, 600, '规划假设'), stages };
}
export function emptyRouteBook()            {
  return { algorithm: { activeId: null, versions: [] }, llm: { activeId: null, versions: [] }, agent: { activeId: null, versions: [] }, explore: { activeId: null, versions: [] } };
}
export function validateRouteBook(input     )            {
  routeKeys(input, learningCategories);
  const book = emptyRouteBook(), ids = new Set        ();
  for (const category of learningCategories) {
    const entry = input[category]; routeKeys(entry, ['activeId', 'versions']);
    if (!Array.isArray(entry.versions)) throw new Error('路线版本格式不正确');
    const versions = entry.versions.map((raw     ) => {
      const route = validateRoute(raw);
      if (route.category !== category || ids.has(route.id)) throw new Error('路线类别不一致或标识重复');
      ids.add(route.id); return route;
    });
    if (entry.activeId !== null && (typeof entry.activeId !== 'string' || !versions.some((r               ) => r.id === entry.activeId))) throw new Error('当前路线引用不正确');
    book[category] = { activeId: entry.activeId, versions };
  }
  return book;
}
export function validateLearningContext(input     )                  {
  routeKeys(input, ['routeId', 'stageId', 'request', 'routeGoal', 'stageTitle', 'stageGoal', 'review']);
  if (typeof input.review !== 'boolean') throw new Error('学习任务复习状态不正确');
  return { routeId: routeId(input.routeId), stageId: routeId(input.stageId), request: routeText(input.request, 12000, '学习需求'), routeGoal: routeText(input.routeGoal, 2000, '路线目标', true), stageTitle: routeText(input.stageTitle, 180, '阶段标题', true), stageGoal: routeText(input.stageGoal, 1200, '阶段目标', true), review: input.review };
}
export function parseRouteOutput(raw        , category          , request        , budget        , identity                                   )                {
  if (typeof raw !== 'string' || raw.length > 128000) throw new Error('路线输出过长或格式不正确');
  const normalized = raw.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1').trim();
  let output     ;
  try { output = JSON.parse(normalized); } catch { throw new Error('路线输出必须是有效 JSON'); }
  routeKeys(output, ['goal', 'assumptions', 'stages']);
  if (!Array.isArray(output.stages) || output.stages.length < 1 || output.stages.length > 60) throw new Error('路线须包含 1–60 个阶段');
  const stages = output.stages.map((s     , index        ) => validateStage(s, `s${index + 1}`));
  return validateRoute({ ...identity, category, request, budget, goal: output.goal, assumptions: output.assumptions, stages });
}
export function activeRoute(book           , category          )                       {
  const entry = book[category]; return entry.versions.find(r => r.id === entry.activeId) || null;
}
export function budgetFor(prefs                   , category          )         {
  if (category === 'agent') return { minMinutes: prefs.agentMinMinutes, maxMinutes: prefs.agentMaxMinutes };
  const minutes = category === 'algorithm' ? prefs.algorithmMinutes : category === 'llm' ? prefs.llmMinutes : prefs.exploreMinutes;
  return { minMinutes: minutes, maxMinutes: minutes };
}
export function requestChanged(prefs                                                , route               )          { return prefs.learningRequests[route.category].trim() !== route.request; }
export function budgetChanged(prefs                   , route               )          { const budget = budgetFor(prefs, route.category); return budget.minMinutes !== route.budget.minMinutes || budget.maxMinutes !== route.budget.maxMinutes; }
export function routePosition(route               , history                  , beforeDate        )                {
  let last               ;
  for (const stage of route.stages) {
    const completedDays = new Set(history.filter(p => p.date < beforeDate && p.tasks.some(t => t.category === route.category && t.done && t.learning?.routeId === route.id && t.learning.stageId === stage.id)).map(p => p.date)).size;
    last = { stage, completedDays, complete: false };
    if (completedDays < stage.estimatedDays) return last;
  }
  return { ...last , complete: true };
}
export function routeMarkdown(route               )         {
  const budget = route.budget.minMinutes === route.budget.maxMinutes ? String(route.budget.minMinutes) : `${route.budget.minMinutes}–${route.budget.maxMinutes}`;
  return `# ${route.goal}\n\n路线：${route.id} · ${route.category}\n生成：${route.createdAt}\n每日预算：${budget} 分钟\n\n## 学习需求\n\n${route.request}\n\n## 规划假设\n\n${route.assumptions.map(a => `- ${a}`).join('\n') || '未提供'}\n\n${route.stages.map((s, i) => `## ${i + 1}. ${s.title}\n\n目标：${s.goal}\n预计 ${s.estimatedDays} 天\n\n重点：\n${s.focus.map(f => `- ${f}`).join('\n') || '无'}\n\n检索词：${s.searchTerms.join('、') || '无'}`).join('\n\n')}\n`;
}
