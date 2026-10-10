import { parseRouteOutput,                                                } from './learning.js';
import { abortable } from './abort.js';



export async function generateRoute(input            , options              )                         {
  const lifetime = options.signal || new AbortController().signal;
  lifetime.throwIfAborted();
  const signal = AbortSignal.any([lifetime, AbortSignal.timeout(120000)]);
  const system = '你是学习路线规划助手。从用户的大段自由文本提取目标、已有基础、学习路径、偏好、约束和可选期限，制定完整阶段路线。用户不必已有准确规划。需求中的规划约束优先于旧路线；根据明确基础及已完成任务摘要调整新路线，但完成任务不等于已掌握知识。未明确的基础或期限写入assumptions，不能假定用户掌握前置内容。每个阶段给明确目标、学习重点、用于资料检索的简短关键词和按每天时间预算估算的天数；区间预算按minMinutes估算并说明。阶段目标覆盖完整需求，不提前固定所有日期的具体任务。算法只规划技能，不编造题号或URL；AI探索按主题、研究与体验目标规划，不编造未来新闻。不要输出进度、标识、日期、URL或角色设定。只输出JSON：{"goal":"整体目标","assumptions":["假设"],"stages":[{"title":"阶段","goal":"阶段目标","estimatedDays":2,"focus":["学习重点"],"searchTerms":["检索关键词"]}]}。1至60个阶段，每阶段1至365天，focus及searchTerms各最多8项，assumptions最多12项。不要输出Markdown代码块。';
  const { identity: _identity, ...context } = input;
  const text = JSON.stringify({ kind: 'route', ...context });
  const call = async (request        ) => {
    const raw = await abortable(() => options.generate(system, request, signal), signal);
    signal.throwIfAborted();
    if (typeof raw !== 'string' || raw.length > 128000) throw new Error('路线返回内容过大或格式不正确');
    return raw;
  };
  try {
    const first = await call(text);
    try { return parseRouteOutput(first, input.category, input.request, input.budget, input.identity); }
    catch {
      const repaired = await call(`${text}\n上次输出未通过路线结构校验。请只按指定JSON字段重新生成完整路线，不添加URL、标识、日期或进度。`);
      return parseRouteOutput(repaired, input.category, input.request, input.budget, input.identity);
    }
  } catch {
    lifetime.throwIfAborted();
    throw new Error('路线生成未成功，原路线已保留。请检查模型设置后重试。');
  }
}
