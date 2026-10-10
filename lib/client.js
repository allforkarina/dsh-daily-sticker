window.__ModuleLoader__.load({id:"dsh-daily-learning",factory:(require)=>{
const module={exports:{}};const exports=module.exports;
const css=".dl-surface{height:100%;overflow:auto;color:var(--dsw-alias-label-primary,#252722);background:var(--dsw-alias-bg-base,#f7f7f2);font-family:\"Segoe UI\",\"Microsoft YaHei\",sans-serif;font-size:14px;line-height:1.65;color-scheme:light dark}\n.dl-surface *{box-sizing:border-box}.dl-memo{position:relative;width:min(100%,860px);margin:0 auto;padding:44px 52px 60px}.dl-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:28px}.dl-kicker{font-size:10px;letter-spacing:.22em;font-weight:600;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-header h1{font-family:\"Noto Serif SC\",\"Source Han Serif SC\",\"SimSun\",serif;font-size:34px;font-weight:600;letter-spacing:.04em;line-height:1.3;margin:10px 0}.dl-subtitle{margin:0;color:var(--dsw-alias-label-secondary,#74796d);font-size:13px}.dl-header-actions{padding-top:8px}.dl-surface button,.dl-surface select,.dl-surface input,.dl-surface textarea{font:inherit;color:inherit}.dl-surface button{background:transparent;border:1px solid var(--dsw-alias-border-l1,#d6dacd);border-radius:5px;padding:5px 11px;cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s}.dl-surface button:hover{background:var(--dsw-alias-bg-hover,#eff1e8)}.dl-surface button:active{transform:translateY(1px)}.dl-surface button:disabled{opacity:.45;cursor:default;transform:none}.dl-surface :focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#727d56);outline-offset:3px}.dl-datebar{display:flex;align-items:center;gap:15px;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l1,#d6dacd);border-bottom:1px solid var(--dsw-alias-border-l1,#d6dacd);padding:12px 0}.dl-datebar select{background:transparent;border:0;font-size:13px;padding:5px 3px;font-variant-numeric:tabular-nums}.dl-datebar button{margin-left:auto;font-size:12px}.dl-quiet{font-size:12px;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-task{padding:26px 0;border-bottom:1px solid var(--dsw-alias-border-l1,#d6dacd)}.dl-task-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.dl-category{font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--dsw-alias-label-secondary,#74796d)}.dl-time{font-family:Consolas,monospace;font-size:11px;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-title-row{display:flex;align-items:center;gap:12px}.dl-title-row h2{font-size:19px;font-weight:600;line-height:1.5;margin:0;text-wrap:pretty;overflow-wrap:anywhere}.dl-title-row input[type=checkbox]{width:17px;height:17px;margin:0;flex-shrink:0;accent-color:var(--dsw-alias-state-business-primary,#727d56);cursor:pointer}.dl-summary{margin:9px 0 12px 29px;line-height:1.8;color:var(--dsw-alias-label-secondary,#74796d);overflow-wrap:anywhere;text-wrap:pretty}.dl-done .dl-title-row h2{text-decoration:line-through;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-done .dl-summary{opacity:.7}.dl-status{display:inline-block;margin-left:29px;margin-bottom:9px;font-size:11px;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-sources{margin:0 0 14px 29px;font-size:12px}.dl-sources>div{margin:8px 0}.dl-sources a{color:var(--dsw-alias-label-primary,#48523b);text-underline-offset:3px;overflow-wrap:anywhere}.dl-sources small{display:block;color:var(--dsw-alias-label-tertiary,#7b8073);font-size:10px}.dl-detail{margin-left:29px;font-size:12px}.dl-surface summary{cursor:pointer;color:var(--dsw-alias-label-secondary,#74796d)}.dl-detail ol{padding-left:21px;line-height:1.9}.dl-detail p{line-height:1.8}.dl-task-actions{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0 0 29px}.dl-task-actions button{font-size:11px}.dl-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:20px;color:var(--dsw-alias-label-tertiary,#7b8073);font-size:11px}.dl-footer button{font-size:11px}.dl-empty{padding:42px 0;color:var(--dsw-alias-label-secondary,#74796d)}.dl-empty h2{font-weight:500;font-size:18px}.dl-message{padding:12px 14px;margin:15px 0;background:var(--dsw-alias-bg-hover,#eff1e8);font-size:12px;border-radius:5px;overflow-wrap:anywhere}.dl-message button{margin-left:12px}.dl-error{color:var(--dsw-alias-label-error,#b35845)}.dl-notices{margin-top:20px;font-size:11px;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-settings{margin:24px 0;padding:22px;border:1px solid var(--dsw-alias-border-l1,#d6dacd);border-radius:6px}.dl-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.dl-section-head h2{font-size:17px;margin:0}.dl-section-head button{font-size:11px}.dl-field{display:flex;flex-direction:column;gap:6px;margin-bottom:15px;font-size:12px}.dl-field>span{font-weight:500}.dl-field input,.dl-field textarea,.dl-field select{width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1,#d6dacd);border-radius:4px;background:var(--dsw-alias-bg-base,#f7f7f2);outline-offset:2px;resize:vertical}.dl-field small{color:var(--dsw-alias-label-tertiary,#7b8073);font-size:10px}.dl-toggle{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:20px}.dl-toggle input{accent-color:var(--dsw-alias-state-business-primary,#727d56)}.dl-settings details{margin:18px 0}.dl-settings summary{font-size:12px;margin-bottom:12px}.dl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.dl-primary{font-weight:600!important;background:var(--dsw-alias-state-business-primary,#727d56)!important;color:var(--dsw-alias-label-primary-inverted,#fff)!important;border-color:transparent!important}.dl-toast{position:sticky;bottom:18px;width:fit-content;margin:18px auto 0;padding:6px 16px;border-radius:5px;background:var(--dsw-alias-label-primary,#252722);color:var(--dsw-alias-bg-base,#f7f7f2);font-size:12px}.dl-copy-fallback{margin-top:22px;padding:18px;border:1px solid var(--dsw-alias-border-l1,#d6dacd);border-radius:5px}.dl-copy-fallback p{font-size:12px}.dl-copy-fallback textarea{display:block;width:100%;padding:10px;font-size:12px;background:var(--dsw-alias-bg-base,#f7f7f2);border:1px solid var(--dsw-alias-border-l1,#d6dacd);border-radius:4px;margin-bottom:12px;resize:vertical}\n.dl-preferences{border:0;padding:0;margin:0;min-width:0}.dl-preferences:disabled{opacity:.55}\n.dl-learning{margin:22px 0 28px;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1,#d6dacd)}.dl-learning h3{font-family:\"Noto Serif SC\",\"Source Han Serif SC\",\"SimSun\",serif;font-size:19px;font-weight:600;margin:0 0 8px}.dl-learning-category{border-bottom:1px solid var(--dsw-alias-border-l1,#d6dacd);padding:12px 0;margin:0!important}.dl-learning-category>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:600;list-style-position:inside;margin:0!important}.dl-learning-category>summary small{font-size:10px;font-weight:400;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-learning-category[open]>summary{margin-bottom:17px!important}.dl-learning-category textarea{line-height:1.8;min-height:150px}.dl-route-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:10px 0 18px}.dl-route-actions button{font-size:12px}.dl-route-hint{font-size:12px;color:var(--dsw-alias-label-secondary,#74796d);padding-left:11px;border-left:2px solid var(--dsw-alias-state-business-primary,#727d56);margin:12px 0}.dl-route-current h4,.dl-route-history h4{font-size:15px;font-weight:600;margin:20px 0 6px;overflow-wrap:anywhere}.dl-route-stages{list-style:none;counter-reset:route-stage;padding:0;margin:16px 0}.dl-route-stages>li{counter-increment:route-stage;position:relative;padding:12px 0 12px 30px;border-top:1px solid var(--dsw-alias-border-l1,#d6dacd)}.dl-route-stages>li:before{content:counter(route-stage,decimal-leading-zero);position:absolute;left:0;top:15px;font:10px Consolas,monospace;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-route-stage-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}.dl-route-stage-head strong{font-size:13px;font-weight:600}.dl-route-stages p{font-size:12px;margin:7px 0;overflow-wrap:anywhere}.dl-route-stage-current:before{color:var(--dsw-alias-state-business-primary,#727d56)!important;font-weight:700!important}.dl-route-assumptions ul{padding-left:18px;font-size:12px;overflow-wrap:anywhere}.dl-route-history{font-size:12px}.dl-route-request{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;padding:10px;background:var(--dsw-alias-bg-hover,#eff1e8)}.dl-task-learning{margin:8px 0 8px 29px;font-size:11px;color:var(--dsw-alias-label-tertiary,#7b8073)}.dl-task-learning span{display:block;margin-top:3px;overflow-wrap:anywhere}\n@media(max-width:650px){.dl-memo{padding:26px 22px 40px}.dl-header{gap:12px}.dl-header h1{font-size:28px}.dl-subtitle{font-size:11px}.dl-summary,.dl-sources,.dl-detail,.dl-task-actions{margin-left:0}.dl-title-row h2{font-size:17px}.dl-settings{padding:16px}.dl-grid{gap:0 10px}.dl-datebar{gap:8px}.dl-footer{align-items:flex-start;flex-wrap:wrap}}\n@media(max-width:650px){.dl-task-learning{margin-left:0}.dl-route-stage-head{display:block}.dl-route-stage-head .dl-quiet{display:block;margin-top:3px}.dl-learning-category>summary{align-items:flex-start}}\n\r\n";
const learning=(()=>{








const MAX_REQUEST_BYTES = 262144;
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
function emptyRouteBook()            {
  return { algorithm: { activeId: null, versions: [] }, llm: { activeId: null, versions: [] }, agent: { activeId: null, versions: [] }, explore: { activeId: null, versions: [] } };
}
function validateRouteBook(input     )            {
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
function validateLearningContext(input     )                  {
  routeKeys(input, ['routeId', 'stageId', 'request', 'routeGoal', 'stageTitle', 'stageGoal', 'review']);
  if (typeof input.review !== 'boolean') throw new Error('学习任务复习状态不正确');
  return { routeId: routeId(input.routeId), stageId: routeId(input.stageId), request: routeText(input.request, 12000, '学习需求'), routeGoal: routeText(input.routeGoal, 2000, '路线目标', true), stageTitle: routeText(input.stageTitle, 180, '阶段标题', true), stageGoal: routeText(input.stageGoal, 1200, '阶段目标', true), review: input.review };
}
function parseRouteOutput(raw        , category          , request        , budget        , identity                                   )                {
  if (typeof raw !== 'string' || raw.length > 128000) throw new Error('路线输出过长或格式不正确');
  const normalized = raw.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1').trim();
  let output     ;
  try { output = JSON.parse(normalized); } catch { throw new Error('路线输出必须是有效 JSON'); }
  routeKeys(output, ['goal', 'assumptions', 'stages']);
  if (!Array.isArray(output.stages) || output.stages.length < 1 || output.stages.length > 60) throw new Error('路线须包含 1–60 个阶段');
  const stages = output.stages.map((s     , index        ) => validateStage(s, `s${index + 1}`));
  return validateRoute({ ...identity, category, request, budget, goal: output.goal, assumptions: output.assumptions, stages });
}
function activeRoute(book           , category          )                       {
  const entry = book[category]; return entry.versions.find(r => r.id === entry.activeId) || null;
}
function budgetFor(prefs                   , category          )         {
  if (category === 'agent') return { minMinutes: prefs.agentMinMinutes, maxMinutes: prefs.agentMaxMinutes };
  const minutes = category === 'algorithm' ? prefs.algorithmMinutes : category === 'llm' ? prefs.llmMinutes : prefs.exploreMinutes;
  return { minMinutes: minutes, maxMinutes: minutes };
}
function requestChanged(prefs                                                , route               )          { return prefs.learningRequests[route.category].trim() !== route.request; }
function budgetChanged(prefs                   , route               )          { const budget = budgetFor(prefs, route.category); return budget.minMinutes !== route.budget.minMinutes || budget.maxMinutes !== route.budget.maxMinutes; }
function routePosition(route               , history                  , beforeDate        )                {
  let last               ;
  for (const stage of route.stages) {
    const completedDays = new Set(history.filter(p => p.date < beforeDate && p.tasks.some(t => t.category === route.category && t.done && t.learning?.routeId === route.id && t.learning.stageId === stage.id)).map(p => p.date)).size;
    last = { stage, completedDays, complete: false };
    if (completedDays < stage.estimatedDays) return last;
  }
  return { ...last , complete: true };
}
function routeMarkdown(route               )         {
  const budget = route.budget.minMinutes === route.budget.maxMinutes ? String(route.budget.minMinutes) : `${route.budget.minMinutes}–${route.budget.maxMinutes}`;
  return `# ${route.goal}\n\n路线：${route.id} · ${route.category}\n生成：${route.createdAt}\n每日预算：${budget} 分钟\n\n## 学习需求\n\n${route.request}\n\n## 规划假设\n\n${route.assumptions.map(a => `- ${a}`).join('\n') || '未提供'}\n\n${route.stages.map((s, i) => `## ${i + 1}. ${s.title}\n\n目标：${s.goal}\n预计 ${s.estimatedDays} 天\n\n重点：\n${s.focus.map(f => `- ${f}`).join('\n') || '无'}\n\n检索词：${s.searchTerms.join('、') || '无'}`).join('\n\n')}\n`;
}

return {emptyRouteBook,activeRoute,budgetFor,routePosition,requestChanged,budgetChanged,validateLearningContext};})();
const domain=(()=>{const { activeRoute, emptyRouteBook, routePosition,                                      } = learning;





const categories             = ['algorithm', 'llm', 'agent', 'explore'];
const labels = { algorithm: '算法', llm: 'LLM', agent: 'Agent 工程', explore: 'AI 探索' };
const llmTopics = ['Prompt 的目标、约束与示例', 'Prompt 对照实验与输出约束', 'token 与分词', 'embedding 与语义距离', '从向量到上下文表示', 'Attention 的 Q、K、V', '手算一个简化 Attention', '多头注意力与位置编码', 'Transformer 的组成', '实现一个小型 Transformer 模块', '自回归预测与预训练目标', '训练数据与损失函数', '微调与 LoRA', '一次小型微调实验的设计', '指令微调与对齐', '偏好优化的直觉', '推理中的采样参数', 'KV Cache 与推理效率'];
const agentTopics = ['实现工具调用', '实现一个单 Agent 循环', '为工具调用添加参数校验', '处理工具失败与重试', '实现短期记忆', '接入检索与上下文', '为 Agent 编写评测用例', '记录运行日志与可观测性'];
function defaults() {
  return {
    timezone: 'Asia/Shanghai', algorithmMinutes: 30, llmMinutes: 30, agentMinMinutes: 60, agentMaxMinutes: 120, exploreMinutes: 25,
    leetcodeSite: 'cn', llmStart: 0, project: '', interests: 'AI 工具、产品更新、工作流、论文、模型能力、训练与推理进展',
    learningRequests: { algorithm: '', llm: '', agent: '', explore: '' },
    roles: { algorithm: '你是耐心的算法导师，先引导分析，再给提示，不直接给完整答案。', llm: '你是苏格拉底式 LLM 导师，以提问和小实验引导我理解原理。', agent: '你是务实的 Agent 工程师，先概括目标，再拆解最小实现和验证方式。', explore: '你是客观的 AI 播报员，区分事实、推测与未知，帮助我判断值得尝试的内容。' }
  };
}
function validDate(value         )                  {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function dateInZone(now      , timezone        ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (name        ) => parts.find(p => p.type === name)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function enteredDate(current        , previousToday               , today               ) {
  return !current || current === previousToday ? today || current : current;
}
function text(value         , max        , name        , empty = false)         {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`${name}格式不正确`);
  return value.trim();
}
function exactKeys(input     , keys          ) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !keys.includes(k))) throw new Error('含未知字段或输入格式不正确');
}
function validatePreferences(input     )              {
  const base = defaults();
  exactKeys(input, Object.keys(base));
  if (input.learningRequests !== undefined) exactKeys(input.learningRequests, categories);
  if (input.roles !== undefined) exactKeys(input.roles, categories);
  const p = { ...base, ...input, roles: { ...base.roles, ...input.roles }, learningRequests: { ...base.learningRequests, ...input.learningRequests } };
  for (const key of ['algorithmMinutes', 'llmMinutes', 'agentMinMinutes', 'agentMaxMinutes', 'exploreMinutes']) if (!Number.isInteger(p[key]) || p[key] < 5 || p[key] > 240) throw new Error('每类预算须为 5–240 分钟');
  if (p.agentMinMinutes > p.agentMaxMinutes) throw new Error('工程时长范围不正确');
  text(p.timezone, 100, '时区');
  new Intl.DateTimeFormat('en', { timeZone: p.timezone }).format();
  if (!['cn', 'com'].includes(p.leetcodeSite)) throw new Error('LeetCode 站点不正确');
  if (!Number.isInteger(p.llmStart) || p.llmStart < 0 || p.llmStart >= llmTopics.length) throw new Error('LLM 起点不正确');
  p.project = text(p.project, 6000, '项目背景', true);
  p.interests = text(p.interests, 1000, '兴趣', true);
  exactKeys(p.roles, categories);
  for (const c of categories) p.roles[c] = text(p.roles[c], 4000, '角色文本', true);
  for (const c of categories) p.learningRequests[c] = text(p.learningRequests[c], 12000, '学习需求', true);
  return p;
}
function safeUrl(input         )         {
  const value = text(input, 2048, '来源地址');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('来源地址不正确');
  return url.href;
}
function topicFor(category          , prefs             , history        ) {
  const matching = [...history].filter(p => category !== 'agent' || p.project === prefs.project).sort((a, b) => b.date.localeCompare(a.date));
  const previous = matching[0]?.tasks.find(t => t.category === category);
  if (category === 'llm' && matching[0] && (matching[0].llmStart ?? 0) !== prefs.llmStart) return prefs.llmStart;
  if (previous && !previous.done && previous.topicIndex !== undefined) return previous.topicIndex;
  const next = previous?.topicIndex !== undefined ? previous.topicIndex + 1 : category === 'llm' ? prefs.llmStart : 0;
  const length = category === 'llm' ? llmTopics.length : agentTopics.length;
  return Math.min(next, length - 1);
}
function sourceMetadata(source        )         { const { text: _body, ...metadata } = source; return metadata; }
function makeTemplate(date        , prefs             , history         = [], sources           = [], routes            = emptyRouteBook())       {
  if (!validDate(date)) throw new Error('日期不正确');
  const li = topicFor('llm', prefs, history), ai = topicFor('agent', prefs, history);
  const problem = sources.find(s => s.id.startsWith('problem:') && s.verified && ['Easy', 'Medium'].includes(s.difficulty || ''));
  const articles = sources.filter(s => !s.id.startsWith('problem:') && s.verified).slice(0, 3);
  const task = (category          , title        , summary        , steps          , acceptance        , minutes        , materials           = [], topicIndex         )       => ({ id: `${date}:${category}`, category, title, summary, steps, acceptance, minutes, done: false, sources: materials.map(sourceMetadata), preparation: category === 'algorithm' && !problem ? 'degraded' : category === 'explore' && !articles.length ? 'degraded' : 'template', ...(topicIndex === undefined ? {} : { topicIndex }) });
  const plan       = {
    date, createdAt: new Date().toISOString(), timezone: prefs.timezone, project: prefs.project, llmStart: prefs.llmStart, mode: 'template', notices: [],
    tasks: [
      task('algorithm', problem ? `${problem.title} · ${problem.difficulty}` : '算法练习 · 待选题', problem ? '分析一种可行解法并练习边界用例。' : '题源暂不可用；先选择一道 Easy/Medium 题，按以下方向练习。', ['读题并列出输入、输出与约束。', '独立分析思路，必要时向导师索取分级提示。', '实现解法并用边界用例验证，解释时间与空间复杂度。'], '能说明解法与复杂度，并验证关键边界。', String(prefs.algorithmMinutes), problem ? [problem] : []),
      task('llm', llmTopics[li], '围绕一个原理做解释与小实验，先提出问题，再检验自己的理解。', ['让导师用一个具体例子引入今天的主题。', '完成一个手算、对照实验或最小代码实验。', '用自己的话说明现象和结论。'], '能解释核心机制，并完成一个小实验。', String(prefs.llmMinutes), [], li),
      task('agent', prefs.project ? '完善当前工程项目' : agentTopics[ai], prefs.project ? `围绕当前项目选择一个可验证的小改进。背景：${prefs.project.slice(0, 800)}` : '先确定这个能力的最小输入、输出和验证方式，再完成一个可运行实现。', ['明确一个小目标及输入、输出。', '在外部 Agent 工具中完成实现或源码研究。', '用一个成功和一个失败场景验证结果。'], '得到一个可运行结果或清晰的实现方案，并完成验证。', prefs.agentMinMinutes === prefs.agentMaxMinutes ? String(prefs.agentMinMinutes) : `${prefs.agentMinMinutes}–${prefs.agentMaxMinutes}`, [], ai),
      task('explore', articles[0]?.title || 'AI 探索 · 非时效练习', articles.length ? '阅读主资料，区分变化、影响与值得尝试的动作；发布日期未知时不要将其当作近期新闻。' : '没有已验证近期资料；选择一个已知 AI 工具或技巧做小体验，不视作最新资讯。', ['阅读一个原始来源或选择一个已知工具。', '找出一个值得关注的变化或用途。', '形成自己的判断，可选做一次小尝试。'], '能概括主题、事实与自己的判断。', String(prefs.exploreMinutes), articles)
    ]
  };
  for (const task of plan.tasks) {
    const route = activeRoute(routes, task.category);
    if (!route) continue;
    const position = routePosition(route, history, date), stage = position.stage;
    task.learning = { routeId: route.id, stageId: stage.id, request: route.request, routeGoal: route.goal, stageTitle: stage.title, stageGoal: stage.goal, review: position.complete };
    delete task.topicIndex;
    const title = `${position.complete ? '复习／综合实践 · ' : ''}${stage.title}`;
    const direction = `${position.complete ? '路线已完成，围绕最后阶段复习或综合实践。' : ''}当前阶段：${stage.title}。阶段目标：${stage.goal}。${stage.focus.length ? `重点：${stage.focus.join('；')}。` : ''}`;
    if (task.category === 'llm' || task.category === 'agent') {
      task.title = title;
      task.summary = `${direction} 模板尚未细化自由文本需求，请围绕阶段目标选择一个符合今日预算的小任务。${task.category === 'agent' && prefs.project ? `工程背景：${prefs.project.slice(0, 800)}` : ''}`;
      task.steps = [`围绕阶段目标确定一个 ${task.minutes} 分钟内的小目标。`, ...stage.focus.slice(0, 2).map(f => `按当前重点练习：${f}`), '通过一个具体例子或最小实验验证结果。'];
      task.acceptance = '完成所选小任务，并能说明结果与当前阶段目标的关系。';
    } else {
      task.title = `${task.title} · ${title}`;
      task.summary = `${direction} ${task.summary}`;
      if (task.category === 'algorithm' && problem?.topicMatched === false) task.summary += ' 已验证题目未匹配当前阶段方向，请勿视为匹配选题。';
    }
  }
  return plan;
}
function validateCandidate(input     , base      , sources          )       {
  exactKeys(input, ['tasks']);
  if (!Array.isArray(input.tasks) || input.tasks.length !== 4) throw new Error('规划必须包含四类任务');
  const seen = new Set();
  const tasks = input.tasks.map((raw     ) => {
    exactKeys(raw, ['category', 'title', 'summary', 'steps', 'acceptance', 'sourceIds']);
    if (!categories.includes(raw.category) || seen.has(raw.category)) throw new Error('任务类别重复或不存在');
    seen.add(raw.category);
    const original = base.tasks.find(t => t.category === raw.category) ;
    if (!Array.isArray(raw.steps) || raw.steps.length < 1 || raw.steps.length > 6) throw new Error('任务建议步骤须为 1–6 条');
    if (!Array.isArray(raw.sourceIds) || raw.sourceIds.length > 3 || raw.sourceIds.some((id         ) => typeof id !== 'string' || !sources.some(s => s.id === id && s.verified))) throw new Error('模型引用了未经验证的来源');
    const selected = sources.filter(s => raw.sourceIds.includes(s.id)).map(sourceMetadata);
    if (raw.category === 'algorithm') return { ...original, steps: raw.steps.map((s     ) => text(s, 600, '步骤')), acceptance: text(raw.acceptance, 1000, '完成标准') };
    if (raw.category === 'explore' && !selected.length) return original;
    return { ...original, title: text(raw.title, 180, '主题'), summary: text(raw.summary, 1600, '概要'), steps: raw.steps.map((s     ) => text(s, 600, '步骤')), acceptance: text(raw.acceptance, 1000, '完成标准'), sources: selected, preparation: 'ready' };
  });
  return { ...base, mode: 'model', tasks: categories.map(c => tasks.find((t      ) => t.category === c)) };
}
function taskText(task      ) {
  return `${labels[task.category]} · ${task.title}\n预计 ${task.minutes} 分钟\n\n${task.summary}\n\n建议：\n${task.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n完成标准：${task.acceptance}\n\n资料：\n${task.sources.map(s => `${s.title}\n${s.url}\n发布日期：${s.publishedAt || '未知'}；检索：${s.fetchedAt}`).join('\n\n') || '未提供；请勿编造来源。'}`;
}
function promptFor(task      , prefs             ) {
  const learning = task.learning;
  const context = learning ? `\n\n学习需求：\n${learning.request}\n\n路线目标：${learning.routeGoal}\n当前阶段：${learning.stageTitle}\n阶段目标：${learning.stageGoal}\n${learning.review ? '路线已完成，今天安排复习或综合实践。' : ''}` : '';
  return `${prefs.roles[task.category] || defaults().roles[task.category]}${context}\n\n这是我的今日学习任务：\n${taskText(task)}\n\n请先给概要，再根据我的回答逐步引导。已有进度和卡点未提供，不要假定我已掌握。学习在当前工具中完成；不需要向规划插件提交步骤或进度，也不要替我宣告完成。`;
}
function planMarkdown(plan      ) {
  return `# ${plan.date} 每日学习计划\n\n${plan.tasks.map(t => `## [${t.done ? 'x' : ' '}] ${labels[t.category]}\n\n${taskText(t)}`).join('\n\n')}\n\n${plan.notices.join('\n')}\n`;
}

return {categories,labels,defaults,llmTopics,taskText,promptFor,enteredDate};})();
const learningLabels = { algorithm: '算法', llm: 'LLM', agent: 'Agent 工程', explore: 'AI 探索' };

function RouteDetails({ route, view, current }) {
  const position = learning.routePosition(route, Object.values(view.state.days), view.today);
  const stageIndex = route.stages.findIndex(stage => stage.id === position.stage.id);
  const budget = route.budget.minMinutes === route.budget.maxMinutes ? `${route.budget.minMinutes}` : `${route.budget.minMinutes}–${route.budget.maxMinutes}`;
  return h('div', { className: current ? 'dl-route-current' : 'dl-route-history' },
    h('h4', null, route.goal),
    h('p', { className: 'dl-quiet' }, `生成于 ${route.createdAt.slice(0, 10)} · 每天 ${budget} 分钟 · 预计 ${route.stages.reduce((sum, stage) => sum + stage.estimatedDays, 0)} 个完成日`),
    current && position.complete && h('p', { className: 'dl-route-hint', role: 'status' }, '路线已完成，后续安排复习或综合实践。可修改需求规划新的方向。'),
    route.assumptions.length > 0 && h('details', { className: 'dl-route-assumptions' }, h('summary', null, '规划假设'), h('ul', null, ...route.assumptions.map((assumption, i) => h('li', { key: i }, assumption)))),
    h('ol', { className: 'dl-route-stages' }, ...route.stages.map((stage, i) => h('li', { key: stage.id, className: i === stageIndex && !position.complete && current ? 'dl-route-stage-current' : '' },
      h('div', { className: 'dl-route-stage-head' }, h('strong', null, stage.title), h('span', { className: 'dl-quiet' }, `${stage.estimatedDays} 天${current ? position.complete || i < stageIndex ? ' · 已完成' : i === stageIndex ? ` · 当前阶段 ${position.completedDays}/${stage.estimatedDays}` : '' : ''}`)),
      h('p', null, stage.goal),
      stage.focus.length > 0 && h('p', { className: 'dl-quiet' }, `学习重点：${stage.focus.join('；')}`),
      stage.searchTerms.length > 0 && h('p', { className: 'dl-quiet' }, `检索方向：${stage.searchTerms.join(' / ')}`)))),
    !current && h('details', null, h('summary', null, '当时的学习需求'), h('p', { className: 'dl-route-request' }, route.request)));
}

function LearningSettings({ view, expectedDataRoot, requests, onRequestsChange, api, onReload, onCommitted, onError, disabled, onGeneratingChange }) {
  const [generating, setGenerating] = useState(null);
  const [message, setMessage] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const generate = async category => {
    setGenerating(category); setMessage(''); onGeneratingChange(true);
    try {
      if (!sameDataRoot(view.config.dataRoot, expectedDataRoot)) throw new Error(ROOT_SESSION_ERROR);
      const committed = await api.call('routeGenerate', { category, revision: view.state.revision, expectedDataRoot });
      if (!alive.current) return;
      onCommitted(committed);
      const refreshed = await onReload();
      if (alive.current && refreshed?.state) onCommitted(refreshed);
      if (alive.current) setMessage('路线已生成');
    } catch (error) {
      if (alive.current) { setMessage(error.message); onError(error.message); }
    } finally { if (alive.current) setGenerating(null); onGeneratingChange(false); }
  };
  const busy = disabled || generating || view.routeGenerating || view.preparing;
  return h('section', { className: 'dl-learning', 'aria-label': '学习需求与路线' },
    h('h3', null, '学习需求与路线'),
    h('p', { className: 'dl-quiet' }, '粘贴想学的内容、基础和偏好即可，无需先写准确规划。保存需求后，分别生成各类路线。清空并保存可停用自定义路线。'),
    ...categories.map(category => {
      const route = learning.activeRoute(view.state.routes || learning.emptyRouteBook(), category);
      const versions = view.state.routes?.[category]?.versions || [];
      const historical = versions.filter(version => version.id !== route?.id).slice().reverse();
      const request = requests[category] || '';
      const saved = (view.state.preferences.learningRequests?.[category] || '').trim() === request.trim();
      const modelSelected = Boolean(view.config.model);
      const label = learningLabels[category];
      return h('details', { key: category, className: 'dl-learning-category' },
        h('summary', null, h('span', null, label), h('small', null, route ? `${route.stages.length} 个阶段` : '未启用自定义路线')),
        h('label', { className: 'dl-field' }, h('span', null, `${label} 学习需求`), h('textarea', { 'aria-label': `${label} 学习需求`, rows: 6, maxLength: 12000, value: request, disabled: Boolean(generating || view.routeGenerating || view.preparing), placeholder: '例如：我想理解 Attention，喜欢手算与代码实验，目前只知道基础线性代数。', onChange: event => { setMessage(''); onRequestsChange({ ...requests, [category]: event.target.value }); } }), h('small', null, `${request.length} / 12000 字符 · 支持换行和 Markdown`)),
        h('div', { className: 'dl-route-actions' }, h(Button, { disabled: Boolean(busy || !saved || !request.trim() || !modelSelected), onClick: () => generate(category), 'aria-label': `${route ? '重新生成' : '生成'} ${label} 路线` }, generating === category || view.routeGenerating === category ? '正在生成路线…' : route ? `重新生成 ${label} 路线` : `生成 ${label} 路线`),
          h('span', { className: 'dl-quiet' }, !saved ? '先保存需求' : !modelSelected ? '请先选择并保存规划模型' : disabled ? '请先保存设置，或等待当前操作完成' : !request.trim() ? '留空时使用默认规划' : '按已保存的需求和每日预算生成')),
        route && learning.requestChanged(view.state.preferences, route) && h('p', { className: 'dl-route-hint' }, '需求已修改，路线尚未更新。'),
        route && learning.budgetChanged(view.state.preferences, route) && h('p', { className: 'dl-route-hint' }, '时间预算已修改，可重新生成路线更新预计天数。'),
        route && h(RouteDetails, { route, view, current: true }),
        historical.length > 0 && h('details', { className: 'dl-route-versions' }, h('summary', null, `历史路线（${historical.length}）`), ...historical.map(version => h('details', { key: version.id, className: 'dl-route-history' }, h('summary', null, `${version.createdAt.slice(0, 10)} · ${version.goal}`), h(RouteDetails, { route: version, view, current: false })))));
    }),
    message && h('p', { className: message === '路线已生成' ? 'dl-route-hint' : 'dl-error', role: message === '路线已生成' ? 'status' : 'alert' }, message),
    h('p', { className: 'dl-quiet' }, '路线更新后可重新规划今日未完成项。完成勾选用于安排后续任务，不代表知识掌握评测。'));
}

const React = require('react');
const { createElement: h, useState, useEffect, useRef, useSyncExternalStore } = React;
const { categories, labels, defaults, llmTopics, taskText, promptFor, enteredDate } = domain;
const NAME = 'dsh-daily-learning';
const ROOT_SESSION_ERROR = '数据目录已被其他客户端更改；请收起并重新打开设置。';
const sameDataRoot = (left, right) => (left || '').trim() === (right || '').trim();

function Button({ children, ...props }) { return h('button', { type: 'button', ...props }, children); }
function Settings({ view, api, onReload, onClose, onError, onSavingChange, disabled }) {
  const [cfg, setCfg] = useState({ ...view.config });
  const [prefs, setPrefs] = useState(structuredClone(view.state?.preferences || defaults()));
  const baseRevision = useRef(view.state?.revision);
  const baseConfig = useRef(structuredClone(view.config));
  const basePreferences = useRef(structuredClone(prefs));
  const rootChanged = (cfg.dataRoot || '').trim() !== (baseConfig.current.dataRoot || '').trim();
  const sessionRootChanged = !sameDataRoot(view.config.dataRoot, baseConfig.current.dataRoot);
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const prefsChanged = JSON.stringify(prefs) !== JSON.stringify(basePreferences.current);
  const configChanged = JSON.stringify(cfg) !== JSON.stringify(baseConfig.current);
  const locked = disabled || saving || generating || view.preparing || Boolean(view.routeGenerating);
  const committed = saved => {
    if (!sameDataRoot(saved.config.dataRoot, baseConfig.current.dataRoot)) throw new Error(ROOT_SESSION_ERROR);
    baseRevision.current = saved.state.revision;
    basePreferences.current = structuredClone(saved.state.preferences);
    setPrefs(structuredClone(saved.state.preferences));
  };
  useEffect(() => {
    if (view.state && !rootChanged && (view.config.dataRoot || '').trim() === (baseConfig.current.dataRoot || '').trim() && JSON.stringify(view.state.preferences) === JSON.stringify(basePreferences.current)) baseRevision.current = view.state.revision;
  }, [view.state?.revision, view.config.dataRoot, rootChanged]);
  useEffect(() => { let alive = true; api.call('catalog', {}).then(value => { if (alive) setCatalog(value); }).catch(e => { if (alive) setMessage(e.message); }); return () => { alive = false; }; }, []);
  const field = (label, control, hint) => h('label', { className: 'dl-field' }, h('span', null, label), control, hint && h('small', null, hint));
  const number = (key, title) => field(title, h('input', { type: 'number', min: 5, max: 240, value: prefs[key], onChange: e => setPrefs({ ...prefs, [key]: Number(e.target.value) }) }));
  const save = async () => {
    if (sessionRootChanged) { setMessage(ROOT_SESSION_ERROR); onError(ROOT_SESSION_ERROR); return; }
    setSaving(true); onSavingChange(true); setMessage('');
    try {
      if (view.state && !rootChanged && JSON.stringify(prefs) !== JSON.stringify(basePreferences.current)) {
        const saved = await api.call('preferences', { preferences: prefs, revision: baseRevision.current, expectedDataRoot: baseConfig.current.dataRoot });
        committed(saved);
      }
      const changed = JSON.stringify(cfg) !== JSON.stringify(baseConfig.current);
      if (changed) {
        await api.call('configure', { ...cfg, dataRoot: cfg.dataRoot?.trim() || null, expectedConfig: baseConfig.current });
        baseConfig.current = structuredClone({ ...cfg, dataRoot: cfg.dataRoot?.trim() || null });
      }
      const refreshed = await onReload();
      if (refreshed && !sameDataRoot(refreshed.config.dataRoot, baseConfig.current.dataRoot)) throw new Error(ROOT_SESSION_ERROR);
      if (refreshed?.state && !rootChanged) committed(refreshed);
      if (rootChanged || !Object.values(prefs.learningRequests || {}).some(request => request.trim())) onClose();
      else setMessage('设置已保存');
    } catch (e) { setMessage(e.message); onError(e.message); }
    finally { setSaving(false); onSavingChange(false); }
  };
  const options = catalog.flatMap(provider => provider.models.map(model => ({ value: JSON.stringify({ provider: provider.id, model: model.id }), label: `${provider.name} / ${model.name || model.id}` })));
  const current = cfg.model ? JSON.stringify(cfg.model) : '';
  if (current && !options.some(o => o.value === current)) options.unshift({ value: current, label: `${cfg.model.provider} / ${cfg.model.model}` });
  return h('section', { className: 'dl-settings', 'aria-label': '规划设置' },
    h('div', { className: 'dl-section-head' }, h('h2', null, '规划设置'), h(Button, { onClick: onClose, disabled: sessionRootChanged ? saving || generating : locked }, '收起')),
    field('数据目录', h('input', { disabled: locked, value: cfg.dataRoot || '', placeholder: '例如 D:\\Learning\\DailyPlans', onChange: e => setCfg({ ...cfg, dataRoot: e.target.value }) }), '首次使用请选择空的本地目录。重选原目录可恢复计划。'),
    field('规划模型', h('select', { disabled: locked, value: current, onChange: e => setCfg({ ...cfg, model: e.target.value ? JSON.parse(e.target.value) : null }) }, h('option', { value: '' }, '暂不选择 · 使用模板'), ...options.map(o => h('option', { key: o.value, value: o.value }, o.label))), '使用宿主已配置的模型。这里无需填写 API Key。'),
    h('label', { className: 'dl-toggle' }, h('input', { disabled: locked, type: 'checkbox', checked: cfg.autoPrepareOnOpen, onChange: e => setCfg({ ...cfg, autoPrepareOnOpen: e.target.checked }) }), '首次打开今日备忘录时自动准备'),
    rootChanged && view.state && h('p', { className: 'dl-quiet' }, '更换目录后请先保存，再调整该目录的学习偏好。旧目录的偏好保留。'),
    sessionRootChanged && h('p', { className: 'dl-error', role: 'alert' }, ROOT_SESSION_ERROR),
    view.state && h('fieldset', { className: 'dl-preferences', disabled: rootChanged || locked },
      h(LearningSettings, { view, expectedDataRoot: baseConfig.current.dataRoot, requests: prefs.learningRequests || { algorithm: '', llm: '', agent: '', explore: '' }, onRequestsChange: learningRequests => { setMessage(''); setPrefs({ ...prefs, learningRequests }); }, api, onReload, onCommitted: committed, onError, disabled: sessionRootChanged || rootChanged || prefsChanged || configChanged || locked, onGeneratingChange: value => { setGenerating(value); onSavingChange(value); } }),
      field('当前工程项目', h('textarea', { rows: 3, value: prefs.project, placeholder: '可留空。以后有项目时填写背景、当前目标或公开仓库链接。', onChange: e => setPrefs({ ...prefs, project: e.target.value }) })),
      field('AI 探索兴趣', h('textarea', { rows: 2, value: prefs.interests, onChange: e => setPrefs({ ...prefs, interests: e.target.value }) })),
      h('details', null, h('summary', null, '时间预算与学习偏好'),
        h('div', { className: 'dl-grid' }, number('algorithmMinutes', '算法 / 分钟'), number('llmMinutes', 'LLM / 分钟'), number('agentMinMinutes', '工程下限 / 分钟'), number('agentMaxMinutes', '工程上限 / 分钟'), number('exploreMinutes', '探索 / 分钟')),
        field('LLM 起点', h('select', { value: prefs.llmStart, onChange: e => setPrefs({ ...prefs, llmStart: Number(e.target.value) }) }, ...llmTopics.map((t, i) => h('option', { key: t, value: i }, t)))),
        field('LeetCode 站点', h('select', { value: prefs.leetcodeSite, onChange: e => setPrefs({ ...prefs, leetcodeSite: e.target.value }) }, h('option', { value: 'cn' }, 'leetcode.cn'), h('option', { value: 'com' }, 'leetcode.com'))),
        field('时区', h('input', { value: prefs.timezone, onChange: e => setPrefs({ ...prefs, timezone: e.target.value }) }))),
      h('details', null, h('summary', null, '复制 Prompt 时的角色风格'), ...categories.map(c => field(labels[c], h('textarea', { rows: 3, value: prefs.roles[c], onChange: e => setPrefs({ ...prefs, roles: { ...prefs.roles, [c]: e.target.value } }) }))))),
    message && h('p', { role: message === '设置已保存' ? 'status' : 'alert', className: message === '设置已保存' ? 'dl-quiet' : 'dl-error' }, message),
    h(Button, { className: 'dl-primary', disabled: locked, onClick: save }, saving ? '正在保存…' : '保存设置'));
}

function Memo({ api, active }) {
  const selected = useSyncExternalStore(active.subscribe, active.getSnapshot, active.getSnapshot);
  const [view, setView] = useState(null);
  const [date, setDate] = useState('');
  const selectedDate = useRef(date);
  selectedDate.current = date;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [online, setOnline] = useState(true);
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState('');
  const [copyText, setCopyText] = useState(null);
  const fallback = useRef(null);
  const autoDates = useRef(new Set());
  const lastEnteredToday = useRef(null);
  const revision = view?.state?.revision;
  const load = async () => {
    try { const next = await api.call('state', {}); setView(next); setOnline(true); return next; }
    catch (e) { setOnline(false); setError(e.message); throw e; }
  };
  const run = async (method, payload) => {
    setBusy(true); setError('');
    try { const next = await api.call(method, { expectedDataRoot: view?.config.dataRoot, ...payload }); setView(next); setOnline(true); return next; }
    catch (e) { setError(e.message); await load().catch(() => {}); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    load().then(next => {
      if (!alive) return;
      const previousToday = lastEnteredToday.current;
      const targetDate = enteredDate(selectedDate.current, previousToday, next.today);
      setDate(targetDate);
      lastEnteredToday.current = next.today;
      if (targetDate === next.today && next.state && next.config.autoPrepareOnOpen && !next.state.days[next.today] && !autoDates.current.has(next.today) && document.visibilityState === 'visible' && api.isActive()) {
        autoDates.current.add(next.today);
        run('prepare', { force: false, expectedDataRoot: next.config.dataRoot });
      }
    }).catch(() => {});
    const reload = () => { if (document.visibilityState === 'visible' && api.isActive()) load().catch(() => {}); };
    const timer = setInterval(reload, 20000);
    document.addEventListener('visibilitychange', reload);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', reload); };
  }, [selected]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (copyText !== null) { fallback.current?.focus(); fallback.current?.select(); } }, [copyText]);
  const copy = async (content) => { try { await navigator.clipboard.writeText(content); setToast('已复制'); } catch { setCopyText(content); } };
  const today = view?.today;
  const shownDate = date || today;
  const plan = view?.state?.days[shownDate];
  const preferences = view?.state?.preferences || defaults();
  const dates = [...new Set([today, ...Object.keys(view?.state?.days || {})].filter(Boolean))].sort().reverse();
  const hasCurrent = Boolean(view?.state?.days[today]);
  const loading = busy || savingSettings || view?.preparing || Boolean(view?.routeGenerating);
  const start = async (force) => { setDate(today); await run('prepare', { force }); };
  return h('div', { className: 'dl-surface' }, h('style', null, css), h('main', { className: 'dl-memo' },
    h('header', { className: 'dl-header' },
      h('div', null, h('div', { className: 'dl-kicker' }, 'DAILY LEARNING'), h('h1', null, '今日安排'), h('p', { className: 'dl-subtitle' }, '把任务留在这里，把学习带到你的工具里。')),
      h('div', { className: 'dl-header-actions' }, view && h(Button, { disabled: loading, onClick: () => setSettings(!settings) }, settings ? '收起设置' : '设置'))),
    view && h('div', { className: 'dl-datebar' },
      today && h('select', { value: shownDate, onChange: e => setDate(e.target.value), 'aria-label': '查看日期' }, ...dates.map(d => h('option', { key: d, value: d }, `${d}${d === today ? ' · 今天' : ''}`))),
      h('span', { className: 'dl-quiet' }, plan ? `${plan.tasks.filter(t => t.done).length} / 4 已完成` : '四类任务，独立安排'),
      view.state && h(Button, { disabled: loading || !online, onClick: () => start(false) }, loading ? '正在准备…' : hasCurrent ? '查看今天' : '准备今日任务')),
    error && h('div', { className: 'dl-message dl-error', role: 'alert' }, error, h(Button, { onClick: () => { setError(''); load().catch(() => {}); } }, '刷新')),
    view?.error && h('div', { className: 'dl-message dl-error', role: 'alert' }, view.error),
    view?.warning && h('div', { className: 'dl-message', role: 'status' }, view.warning),
    !view && h('p', { className: 'dl-empty' }, '正在打开备忘录…'),
    view && (!view.state || settings) && h(Settings, { view, api, disabled: busy || !online, onSavingChange: setSavingSettings, onReload: async () => {
      const next = await load();
      if (next.state && next.config.autoPrepareOnOpen && !next.state.days[next.today] && api.isActive() && document.visibilityState === 'visible') {
        autoDates.current.add(next.today); setDate(next.today);
        return await run('prepare', { force: false, expectedDataRoot: next.config.dataRoot }) || await load();
      }
      return next;
    }, onClose: () => setSettings(false), onError: setError }),
    view?.state && shownDate !== today && !hasCurrent && h('p', { className: 'dl-message' }, '今天尚未准备。点击“准备今日任务”后才会生成新计划。'),
    view?.state && !plan && h('div', { className: 'dl-empty' }, h('h2', null, loading ? '正在安排今天' : '今天留出一点学习时间'), h('p', null, loading ? '正在取得资料并准备四类任务。你可以稍后回来查看。' : '算法、LLM、Agent 工程与 AI 探索，各有一个清晰目标。')),
    plan && h('section', { className: 'dl-task-list', 'aria-label': '每日任务' }, ...plan.tasks.map((task, index) =>
      h('article', { className: `dl-task${task.done ? ' dl-done' : ''}`, key: task.id },
        h('div', { className: 'dl-task-top' }, h('span', { className: 'dl-category' }, `${String(index + 1).padStart(2, '0')} / ${labels[task.category]}`), h('span', { className: 'dl-time' }, `${task.minutes} 分钟`)),
        h('div', { className: 'dl-title-row' }, h('input', { type: 'checkbox', checked: task.done, disabled: loading || !online, 'aria-label': `${task.title}完成`, onChange: e => run('check', { date: shownDate, category: task.category, done: e.target.checked, revision }) }), h('h2', null, task.title)),
        task.learning && h('p', { className: 'dl-task-learning' }, `${task.learning.review ? '复习 / 综合实践' : '学习阶段'} · ${task.learning.stageTitle}`, h('span', null, task.learning.stageGoal)),
        h('p', { className: 'dl-summary' }, task.summary),
        task.preparation === 'degraded' && h('span', { className: 'dl-status' }, task.category === 'algorithm' ? '待选题' : '非时效练习'),
        task.sources.length > 0 && h('div', { className: 'dl-sources' }, ...task.sources.map((source, i) => h('div', { key: source.id }, h('a', { href: source.url, target: '_blank', rel: 'noreferrer noopener' }, `${i ? '备选 · ' : ''}${source.title}`), h('small', null, `发布日期 ${source.publishedAt || '未知'} · 检索 ${new Intl.DateTimeFormat('zh-CN', { timeZone: preferences.timezone }).format(new Date(source.fetchedAt))}`)))),
        h('details', { className: 'dl-detail' }, h('summary', null, '查看学习建议'), h('ol', null, ...task.steps.map((step, i) => h('li', { key: i }, step))), h('p', null, h('strong', null, '完成标准：'), task.acceptance)),
        h('div', { className: 'dl-task-actions' }, h(Button, { onClick: () => copy(taskText(task)) }, '复制任务'), h(Button, { onClick: () => copy(promptFor(task, preferences)) }, '复制学习 Prompt'))))),
    plan?.notices?.length > 0 && h('div', { className: 'dl-notices' }, ...plan.notices.map((notice, i) => h('p', { key: i }, notice))),
    plan && shownDate === today && h('footer', { className: 'dl-footer' }, h('span', null, plan.mode === 'model' ? '已保存 · 模型规划' : '已保存 · 模板'), h(Button, { disabled: loading || !online, onClick: () => start(true) }, '重新规划未完成项')),
    toast && h('div', { className: 'dl-toast', role: 'status' }, toast),
    copyText !== null && h('section', { className: 'dl-copy-fallback', 'aria-label': '手动复制' }, h('p', null, '浏览器暂不支持直接复制。内容已选中，按 Ctrl+C 即可。'), h('textarea', { ref: fallback, readOnly: true, value: copyText, rows: 10 }), h(Button, { onClick: () => setCopyText(null) }, '关闭'))));
}
function Icon({ size = 18 }) { return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true }, h('rect', { x: 5, y: 3, width: 14, height: 18, rx: 2 }), h('path', { d: 'M9 8h6M9 12h6M9 16h4' })); }
exports.inject = ['slots', 'layout', 'connection'];
exports.apply = function apply(ctx) {
  const requests = new Set();
  const isActive = () => ctx.layout.panelInfo.getSnapshot().activePanelId === NAME;
  const api = {
    isActive,
    call: async (method, payload) => {
      const controller = new AbortController(); requests.add(controller);
      try { const result = await ctx.connection.rpc.call('/daily-learning', method, payload, controller.signal); if (!result?.ok) throw new Error(result?.error?.message || '请求失败'); return result.value; }
      finally { requests.delete(controller); }
    }
  };
  const active = { getSnapshot: isActive, subscribe: listener => ctx.layout.panelInfo.subscribe(listener) };
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: NAME, inject: () => ({ api, active }) }, Memo));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: NAME, order: 5, label: '每日学习' }, Icon));
  ctx.effect(() => () => { for (const request of requests) request.abort(); requests.clear(); }, 'daily-learning: abort client requests');
};

return module.exports;
}});
