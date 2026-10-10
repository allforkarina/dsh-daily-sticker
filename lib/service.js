import { dateInZone, validDate, categories, validatePreferences,                             } from './domain.js';
import { LocalStore } from './store.js';
import { activeRoute, budgetFor,                                                   } from './learning.js';
import { randomUUID } from 'node:crypto';


export class DailyService {
  store            ;
  planner                                                                                                ;
  now            ;
  routeGenerator                                                ;
  constructor(store            , planner                                                                                                , now = () => new Date(), routeGenerator                                                ) { this.store = store; this.planner = planner; this.now = now; this.routeGenerator = routeGenerator; }
  pending                      = null;
  routePending                      = null;
  routeGenerating                  = null;
  async snapshot() {
    const state = await this.store.read();
    return { state, today: dateInZone(this.now(), state.preferences.timezone), warning: this.store.snapshotWarning, preparing: this.pending !== null, routeGenerating: this.routeGenerating };
  }
  async prepare(force         ) {
    if (this.routePending) throw new Error('路线正在生成，请稍后再准备任务');
    if (this.pending) { await this.pending; return this.snapshot(); }
    const operation = async () => {
      const state = await this.store.read();
      const date = dateInZone(this.now(), state.preferences.timezone);
      if (state.days[date] && !force) return;
      const history = Object.values(state.days).sort((a, b) => b.date.localeCompare(a.date));
      const plan = await this.planner(date, state.preferences, history, state.routes);
      if (state.days[date]) plan.tasks = plan.tasks.map(t => state.days[date].tasks.find(old => old.category === t.category && old.done) || t);
      state.days[date] = plan;
      await this.store.commit(state.revision, state);
    };
    this.pending = operation();
    try { await this.pending; } finally { this.pending = null; }
    return this.snapshot();
  }
  async check(date        , category        , done         , revision        ) {
    if (!validDate(date) || !categories.includes(category       ) || typeof done !== 'boolean' || !Number.isSafeInteger(revision)) throw new Error('完成勾选输入不正确');
    const state = await this.store.read();
    const task = state.days[date]?.tasks.find(t => t.category === category);
    if (!task) throw new Error('任务不存在');
    task.done = done;
    await this.store.commit(revision, state);
    return this.snapshot();
  }
  async preferences(input     , revision        ) {
    const prefs = validatePreferences(input);
    const state = await this.store.read();
    state.preferences = prefs;
    for (const category of categories) if (!prefs.learningRequests[category]) state.routes[category].activeId = null;
    await this.store.commit(revision, state);
    return this.snapshot();
  }
  async generateRoute(category        , revision        ) {
    if (!categories.includes(category            ) || !Number.isSafeInteger(revision)) throw new Error('路线生成参数不正确');
    if (!this.routeGenerator) throw new Error('请先配置宿主规划模型，再生成路线');
    if (this.routePending || this.pending) throw new Error('规划操作正在进行，请稍后再生成路线');
    const selected = category            ;
    const operation = async () => {
      const state = await this.store.read();
      if (revision !== state.revision) throw new Error('数据已更新，操作冲突；请刷新后重试');
      const request = state.preferences.learningRequests[selected];
      if (!request.trim()) throw new Error('请先填写并保存该类学习需求');
      const recentCompleted = Object.values(state.days).sort((a, b) => b.date.localeCompare(a.date)).flatMap(plan => plan.tasks.filter(t => t.category === selected && t.done).map(t => ({ date: plan.date, title: t.title }))).slice(0, 30);
      const route = await this.routeGenerator ({ category: selected, request, budget: budgetFor(state.preferences, selected), previous: activeRoute(state.routes, selected), recentCompleted, identity: { id: randomUUID(), createdAt: this.now().toISOString() } });
      state.routes[selected].versions.push(route);
      state.routes[selected].activeId = route.id;
      await this.store.commit(revision, state);
    };
    this.routeGenerating = selected;
    this.routePending = operation();
    try { await this.routePending; }
    finally { this.routePending = null; this.routeGenerating = null; }
    return this.snapshot();
  }
}
