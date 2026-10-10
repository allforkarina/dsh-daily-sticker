import { activeRoute, emptyRouteBook, routePosition,                                      } from './learning.js';





export const categories             = ['algorithm', 'llm', 'agent', 'explore'];
export const labels = { algorithm: '算法', llm: 'LLM', agent: 'Agent 工程', explore: 'AI 探索' };
export const llmTopics = ['Prompt 的目标、约束与示例', 'Prompt 对照实验与输出约束', 'token 与分词', 'embedding 与语义距离', '从向量到上下文表示', 'Attention 的 Q、K、V', '手算一个简化 Attention', '多头注意力与位置编码', 'Transformer 的组成', '实现一个小型 Transformer 模块', '自回归预测与预训练目标', '训练数据与损失函数', '微调与 LoRA', '一次小型微调实验的设计', '指令微调与对齐', '偏好优化的直觉', '推理中的采样参数', 'KV Cache 与推理效率'];
export const agentTopics = ['实现工具调用', '实现一个单 Agent 循环', '为工具调用添加参数校验', '处理工具失败与重试', '实现短期记忆', '接入检索与上下文', '为 Agent 编写评测用例', '记录运行日志与可观测性'];
export function defaults() {
  return {
    timezone: 'Asia/Shanghai', algorithmMinutes: 30, llmMinutes: 30, agentMinMinutes: 60, agentMaxMinutes: 120, exploreMinutes: 25,
    leetcodeSite: 'cn', llmStart: 0, project: '', interests: 'AI 工具、产品更新、工作流、论文、模型能力、训练与推理进展',
    learningRequests: { algorithm: '', llm: '', agent: '', explore: '' },
    roles: { algorithm: '你是耐心的算法导师，先引导分析，再给提示，不直接给完整答案。', llm: '你是苏格拉底式 LLM 导师，以提问和小实验引导我理解原理。', agent: '你是务实的 Agent 工程师，先概括目标，再拆解最小实现和验证方式。', explore: '你是客观的 AI 播报员，区分事实、推测与未知，帮助我判断值得尝试的内容。' }
  };
}
export function validDate(value         )                  {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function dateInZone(now      , timezone        ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (name        ) => parts.find(p => p.type === name)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function enteredDate(current        , previousToday               , today               ) {
  return !current || current === previousToday ? today || current : current;
}
export function text(value         , max        , name        , empty = false)         {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`${name}格式不正确`);
  return value.trim();
}
export function exactKeys(input     , keys          ) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !keys.includes(k))) throw new Error('含未知字段或输入格式不正确');
}
export function validatePreferences(input     )              {
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
export function safeUrl(input         )         {
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
export function makeTemplate(date        , prefs             , history         = [], sources           = [], routes            = emptyRouteBook())       {
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
export function validateCandidate(input     , base      , sources          )       {
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
export function taskText(task      ) {
  return `${labels[task.category]} · ${task.title}\n预计 ${task.minutes} 分钟\n\n${task.summary}\n\n建议：\n${task.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n完成标准：${task.acceptance}\n\n资料：\n${task.sources.map(s => `${s.title}\n${s.url}\n发布日期：${s.publishedAt || '未知'}；检索：${s.fetchedAt}`).join('\n\n') || '未提供；请勿编造来源。'}`;
}
export function promptFor(task      , prefs             ) {
  const learning = task.learning;
  const context = learning ? `\n\n学习需求：\n${learning.request}\n\n路线目标：${learning.routeGoal}\n当前阶段：${learning.stageTitle}\n阶段目标：${learning.stageGoal}\n${learning.review ? '路线已完成，今天安排复习或综合实践。' : ''}` : '';
  return `${prefs.roles[task.category] || defaults().roles[task.category]}${context}\n\n这是我的今日学习任务：\n${taskText(task)}\n\n请先给概要，再根据我的回答逐步引导。已有进度和卡点未提供，不要假定我已掌握。学习在当前工具中完成；不需要向规划插件提交步骤或进度，也不要替我宣告完成。`;
}
export function planMarkdown(plan      ) {
  return `# ${plan.date} 每日学习计划\n\n${plan.tasks.map(t => `## [${t.done ? 'x' : ' '}] ${labels[t.category]}\n\n${taskText(t)}`).join('\n\n')}\n\n${plan.notices.join('\n')}\n`;
}
