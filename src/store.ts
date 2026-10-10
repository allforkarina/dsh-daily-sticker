import { open, readFile, writeFile, mkdir, rename, unlink, readdir, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { defaults, validatePreferences, validDate, categories, planMarkdown, exactKeys, safeUrl, type Plan, type Preferences } from './domain.ts';
import { emptyRouteBook, validateRouteBook, validateLearningContext, routeMarkdown, type RouteBook } from './learning.ts';

export type State = { schemaVersion: number; revision: number; preferences: Preferences; days: Record<string, Plan>; routes: RouteBook };
async function atomic(path: string, contents: string) {
  const temp = `${path}.${randomUUID()}.tmp`;
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(contents, 'utf8'); await handle.sync(); } finally { await handle.close(); }
  try { await rename(temp, path); } catch (error) { await unlink(temp).catch(() => {}); throw error; }
}
function validateState(state: any, legacy = false): State {
  if (state?.schemaVersion !== (legacy ? 1 : 2)) throw new Error('数据版本不受支持，已保留原文件');
  exactKeys(state, legacy ? ['schemaVersion', 'revision', 'preferences', 'days'] : ['schemaVersion', 'revision', 'preferences', 'days', 'routes']);
  if (!Number.isSafeInteger(state.revision) || state.revision < 0 || !state.days || typeof state.days !== 'object' || Array.isArray(state.days)) throw new Error('数据文件损坏，已保留原文件');
  const preferences = validatePreferences(state.preferences);
  const routes = legacy ? emptyRouteBook() : validateRouteBook(state.routes);
  for (const [date, plan] of Object.entries<any>(state.days)) {
    if (!validDate(date) || !plan || plan.date !== date || !Array.isArray(plan.tasks) || plan.tasks.length !== 4 || categories.some(c => plan.tasks.filter((t: any) => t?.category === c).length !== 1)) throw new Error('日期计划损坏，已保留原文件');
    if (typeof plan.createdAt !== 'string' || !Number.isFinite(Date.parse(plan.createdAt)) || typeof plan.timezone !== 'string' || typeof plan.project !== 'string' || typeof plan.mode !== 'string' || !Array.isArray(plan.notices) || plan.notices.some((n: any) => typeof n !== 'string') || (plan.llmStart !== undefined && !Number.isInteger(plan.llmStart))) throw new Error('日期计划损坏，已保留原文件');
    new Intl.DateTimeFormat('en', { timeZone: plan.timezone }).format();
    for (const task of plan.tasks) {
      if (!task || task.id !== `${date}:${task.category}` || typeof task.done !== 'boolean' || ['title', 'summary', 'acceptance', 'minutes', 'preparation'].some(k => typeof task[k] !== 'string') || !Array.isArray(task.steps) || task.steps.some((s: any) => typeof s !== 'string') || !Array.isArray(task.sources) || (task.note !== undefined && typeof task.note !== 'string') || (task.topicIndex !== undefined && (!Number.isInteger(task.topicIndex) || task.topicIndex < 0))) throw new Error('日期任务损坏，已保留原文件');
      for (const source of task.sources) {
        if (!source || typeof source.id !== 'string' || typeof source.title !== 'string' || typeof source.fetchedAt !== 'string' || !Number.isFinite(Date.parse(source.fetchedAt)) || typeof source.verified !== 'boolean' || ['publishedAt', 'difficulty', 'slug', 'text'].some(k => source[k] !== undefined && typeof source[k] !== 'string') || (source.topicMatched !== undefined && typeof source.topicMatched !== 'boolean')) throw new Error('任务来源损坏，已保留原文件');
        safeUrl(source.url);
      }
      if (task.learning !== undefined) task.learning = validateLearningContext(task.learning);
    }
  }
  return { ...state, schemaVersion: 2, preferences, routes };
}
export class LocalStore {
  root: string;
  state: State;
  token = randomUUID();
  queue: Promise<any> = Promise.resolve();
  closed = false;
  snapshotWarning: string | null = null;
  private constructor(root: string) { this.root = root; }
  static async open(input: string) {
    if (!isAbsolute(input) || input.startsWith('\\\\')) throw new Error('请选择本机绝对数据目录');
    await mkdir(input, { recursive: true });
    const root = await realpath(input);
    const marker = join(root, '.dsh-daily-learning.json');
    try {
      if (JSON.parse(await readFile(marker, 'utf8')).owner !== 'dsh-daily-learning') throw new Error('目录标识不匹配');
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
      if ((await readdir(root)).length) throw new Error('首次使用请选择空目录，避免覆盖已有文件');
      await writeFile(marker, JSON.stringify({ owner: 'dsh-daily-learning', version: 1 }), { flag: 'wx', mode: 0o600 });
    }
    const store = new LocalStore(root);
    await store.lock();
    try {
      await mkdir(join(root, 'store'), { recursive: true });
      await mkdir(join(root, 'backups'), { recursive: true });
      let original: Buffer | null = null;
      try { original = await readFile(join(root, 'store', 'state.json')); }
      catch (error: any) { if (error.code !== 'ENOENT') throw error; }
      if (original === null) {
        store.state = { schemaVersion: 2, revision: 0, preferences: defaults(), days: {}, routes: emptyRouteBook() };
        await atomic(join(root, 'store', 'state.json'), JSON.stringify(store.state, null, 2));
      } else {
        const inputState = JSON.parse(original.toString('utf8'));
        store.state = validateState(inputState, inputState?.schemaVersion === 1);
        if (inputState.schemaVersion === 1) {
          const backup = await open(join(root, 'backups', `state-v1-before-0.2.0-${randomUUID()}.json`), 'wx', 0o600);
          try { await backup.writeFile(original); await backup.sync(); } finally { await backup.close(); }
          await atomic(join(root, 'store', 'state.json'), JSON.stringify(store.state, null, 2));
        }
      }
      await store.snapshots(store.state);
      return store;
    } catch (error) { await store.close(); throw error; }
  }
  async lock() {
    const path = join(this.root, '.writer.lock');
    const contents = JSON.stringify({ token: this.token, pid: process.pid, host: hostname() });
    try { await writeFile(path, contents, { flag: 'wx', mode: 0o600 }); }
    catch (error: any) {
      if (error.code !== 'EEXIST') throw error;
      let stale = false;
      try {
        const previous = JSON.parse(await readFile(path, 'utf8'));
        if (previous.host === hostname() && Number.isInteger(previous.pid) && previous.pid > 0) {
          try { process.kill(previous.pid, 0); } catch (probe: any) { stale = probe.code === 'ESRCH'; }
        }
      } catch {}
      if (!stale) throw new Error('数据目录已被另一个 Host 占用，或写入锁需要人工检查');
      await unlink(path);
      await writeFile(path, contents, { flag: 'wx', mode: 0o600 });
    }
  }
  async read(): Promise<State> { if (this.closed) throw new Error('数据空间已关闭'); return structuredClone(this.state); }
  async commit(expected: number, input: State) {
    const operation = this.queue.then(async () => {
      if (this.closed) throw new Error('数据空间已关闭');
      if (this.state.revision !== expected) throw new Error('数据已更新，操作冲突；请刷新后重试');
      const next = validateState(structuredClone(input));
      next.revision = expected + 1;
      await atomic(join(this.root, 'backups', `state-r${String(expected).padStart(10, '0')}.json`), JSON.stringify(this.state, null, 2));
      await atomic(join(this.root, 'store', 'state.json'), JSON.stringify(next, null, 2));
      this.state = next;
      await this.snapshots(next);
      const backups = (await readdir(join(this.root, 'backups'))).filter(n => /^state-r\d{10}\.json$/.test(n)).sort();
      for (const filename of backups.slice(0, -30)) await unlink(join(this.root, 'backups', filename)).catch(() => {});
      return structuredClone(next);
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  async snapshots(state: State) {
    try {
      for (const [date, plan] of Object.entries(state.days)) {
        if (!validDate(date)) throw new Error('日期不正确');
        const dir = join(this.root, 'days', date);
        await mkdir(dir, { recursive: true });
        await atomic(join(dir, 'plan.json'), JSON.stringify(plan, null, 2));
        await atomic(join(dir, 'plan.md'), planMarkdown(plan));
      }
      for (const category of categories) {
        for (const route of state.routes[category].versions) {
          const dir = join(this.root, 'routes', category);
          await mkdir(dir, { recursive: true });
          await atomic(join(dir, `${route.id}.json`), JSON.stringify(route, null, 2));
          await atomic(join(dir, `${route.id}.md`), routeMarkdown(route));
        }
      }
      this.snapshotWarning = null;
    } catch { this.snapshotWarning = '数据已保存，日期或路线文件待同步；重新打开后会重试。'; }
  }
  async close() {
    if (this.closed) return;
    await this.queue;
    this.closed = true;
    const path = join(this.root, '.writer.lock');
    try { if (JSON.parse(await readFile(path, 'utf8')).token === this.token) await unlink(path); } catch {}
  }
}
