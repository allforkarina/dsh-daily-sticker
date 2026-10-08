import { dateInZone, validDate, categories, validatePreferences, type Plan, type Preferences } from './domain.ts';
import { LocalStore } from './store.ts';

export class DailyService {
  store: LocalStore;
  planner: (date: string, preferences: Preferences, history: Plan[]) => Promise<Plan>;
  now: () => Date;
  constructor(store: LocalStore, planner: (date: string, preferences: Preferences, history: Plan[]) => Promise<Plan>, now = () => new Date()) { this.store = store; this.planner = planner; this.now = now; }
  pending: Promise<any> | null = null;
  async snapshot() {
    const state = await this.store.read();
    return { state, today: dateInZone(this.now(), state.preferences.timezone), warning: this.store.snapshotWarning, preparing: this.pending !== null };
  }
  async prepare(force: boolean) {
    if (this.pending) return this.pending;
    const operation = async () => {
      const state = await this.store.read();
      const date = dateInZone(this.now(), state.preferences.timezone);
      if (state.days[date] && !force) return this.snapshot();
      const history = Object.values(state.days).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
      const plan = await this.planner(date, state.preferences, history);
      if (state.days[date]) plan.tasks = plan.tasks.map(t => state.days[date].tasks.find(old => old.category === t.category && old.done) || t);
      state.days[date] = plan;
      await this.store.commit(state.revision, state);
      return this.snapshot();
    };
    this.pending = operation();
    try { return await this.pending; } finally { this.pending = null; }
  }
  async check(date: string, category: string, done: boolean, revision: number) {
    if (!validDate(date) || !categories.includes(category as any) || typeof done !== 'boolean' || !Number.isSafeInteger(revision)) throw new Error('完成勾选输入不正确');
    const state = await this.store.read();
    const task = state.days[date]?.tasks.find(t => t.category === category);
    if (!task) throw new Error('任务不存在');
    task.done = done;
    await this.store.commit(revision, state);
    return this.snapshot();
  }
  async preferences(input: any, revision: number) {
    const prefs = validatePreferences(input);
    const state = await this.store.read();
    state.preferences = prefs;
    await this.store.commit(revision, state);
    return this.snapshot();
  }
}
