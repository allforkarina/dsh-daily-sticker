import z from '@deepseek-ai/schemastery';
import { createSystemMessage, createUserMessage } from '@deepseek-ai/dsh-llm';
import { LocalStore } from './store.js';
import { DailyService } from './service.js';
import { planDay, streamText } from './planner.js';
import { collectSources } from './sources.js';
import { defaults, exactKeys, text } from './domain.js';
import { rpcRoute } from './routes.js';
import { abortable } from './abort.js';
import { generateRoute } from './route-planner.js';
import { MAX_REQUEST_BYTES } from './learning.js';

export const name = 'dsh-daily-learning';
export const inject = ['connection', 'webServer', 'llm', 'web', 'configEditor'];
export const Config = z.object({
  dataRoot: z.union([z.string(), z.const(null)]).default(null).description('学习计划数据目录（本机绝对路径，可先留空）'),
  model: z.union([z.object({ provider: z.string().required(), model: z.string().required() }), z.const(null)]).default(null).description('宿主规划模型；空值使用模板'),
  autoPrepareOnOpen: z.boolean().default(true).description('首次进入未准备的今日面板时自动准备')
});
export function apply(ctx     , config     ) {
  const lifetime = new AbortController();
  let store                    = null;
  let service                      = null;
  let error                = null;
  const generateWithHost = async (system        , input        , signal             , maxChars = 48000) => {
    const route = await ctx.llm.resolveCallConfig(config.model, signal);
    const messages = [createSystemMessage(system), createUserMessage({ content: [{ type: 'text', text: input }], source: { kind: 'operator' } })];
    return streamText(ctx.llm.stream({ ...route, messages, signal }), maxChars);
  };
  const activation = (async () => {
    if (!config.dataRoot) return;
    try {
      store = await LocalStore.open(config.dataRoot);
      lifetime.signal.throwIfAborted();
      service = new DailyService(store, async (date, prefs, history, routes) => planDay(date, prefs, history, {
        signal: lifetime.signal,
        routes,
        sources: () => collectSources(store .root, ctx.web, prefs, date, history, lifetime.signal, routes),
        ...(config.model ? { generate: generateWithHost } : {})
      }), () => new Date(), config.model ? input => generateRoute(input, { signal: lifetime.signal, generate: (system, text, signal) => generateWithHost(system, text, signal, 128000) }) : undefined);
    } catch (cause     ) { error = cause.code ? `数据目录暂不可用（${cause.code}），请检查路径或权限。` : cause.message; }
  })();
  async function snapshot() {
    await activation;
    const value = service ? await service.snapshot() : { state: null, today: null, preparing: false, routeGenerating: null, warning: null };
    return { ...value, config: { dataRoot: config.dataRoot, model: config.model, autoPrepareOnOpen: config.autoPrepareOnOpen }, error, defaults: defaults() };
  }
  async function catalog() {
    const signal = AbortSignal.any([lifetime.signal, AbortSignal.timeout(15000)]);
    const providers = ctx.llm.listProviders();
    const models = await abortable(() => Promise.all(providers.map(async (provider     ) => {
      try { return { id: provider.id, name: provider.name || provider.id, models: await ctx.llm.listModels(provider.id) }; }
      catch { return { id: provider.id, name: provider.name || provider.id, models: [] }; }
    })), signal);
    signal.throwIfAborted();
    return models;
  }
  const methods = {
    state: async (payload     ) => { exactKeys(payload, []); return snapshot(); },
    catalog: async (payload     ) => { exactKeys(payload, []); return catalog(); },
    prepare: async (payload     ) => {
      exactKeys(payload, ['force', 'expectedDataRoot']);
      if (typeof payload.force !== 'boolean') throw new Error('准备参数不正确');
      await activation;
      if (!service) throw new Error(error || '请先配置数据目录');
      await service.prepare(payload.force);
      return snapshot();
    },
    check: async (payload     ) => {
      exactKeys(payload, ['date', 'category', 'done', 'revision', 'expectedDataRoot']);
      await activation;
      if (!service) throw new Error('请先配置数据目录');
      await service.check(payload.date, payload.category, payload.done, payload.revision);
      return snapshot();
    },
    preferences: async (payload     ) => {
      exactKeys(payload, ['preferences', 'revision', 'expectedDataRoot']);
      await activation;
      if (!service) throw new Error('请先配置数据目录');
      await service.preferences(payload.preferences, payload.revision);
      return snapshot();
    },
    routeGenerate: async (payload     ) => {
      exactKeys(payload, ['category', 'revision', 'expectedDataRoot']);
      await activation;
      if (!service) throw new Error(error || '请先配置数据目录');
      await service.generateRoute(payload.category, payload.revision);
      return snapshot();
    },
    configure: async (payload     ) => {
      exactKeys(payload, ['dataRoot', 'model', 'autoPrepareOnOpen', 'expectedConfig']);
      exactKeys(payload.expectedConfig, ['dataRoot', 'model', 'autoPrepareOnOpen']);
      if (JSON.stringify(payload.expectedConfig) !== JSON.stringify({ dataRoot: config.dataRoot, model: config.model, autoPrepareOnOpen: config.autoPrepareOnOpen })) throw new Error('宿主配置已更新，请关闭设置后重新打开再修改');
      const dataRoot = payload.dataRoot === null ? null : text(payload.dataRoot, 1024, '数据目录');
      if (payload.model !== null) {
        exactKeys(payload.model, ['provider', 'model']);
        text(payload.model.provider, 200, 'provider'); text(payload.model.model, 200, 'model');
        await ctx.llm.resolveCallConfig(payload.model, AbortSignal.any([lifetime.signal, AbortSignal.timeout(15000)]));
      }
      if (typeof payload.autoPrepareOnOpen !== 'boolean') throw new Error('自动准备参数不正确');
      const entry = ctx.configEditor.entries().find((entry     ) => entry.fiber === ctx.fiber);
      if (!entry) throw new Error('本插件配置行不可编辑；请通过宿主插件设置配置');
      await ctx.configEditor.edit(entry, (current     ) => ({ ...current, dataRoot, model: payload.model, autoPrepareOnOpen: payload.autoPrepareOnOpen }));
      return { saved: true };
    }
  };
  const dispatch = async (method        , payload     ) => {
    try {
      lifetime.signal.throwIfAborted();
      if (!Object.hasOwn(methods, method)) throw new Error('未知操作');
      if (Buffer.byteLength(JSON.stringify(payload ?? null), 'utf8') > MAX_REQUEST_BYTES) throw new Error('请求内容过大');
      return { ok: true, value: await methods[method](payload) };
    } catch (cause     ) {
      return { ok: false, error: { code: 'daily-learning/error', message: cause.code && !String(cause.code).startsWith('daily') ? `操作失败（${cause.code}），请检查设置后重试。` : String(cause.message || '操作失败').slice(0, 600), details: {} } };
    }
  };
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/daily-learning', handler: rpcRoute(ctx.connection, dispatch, () => config.dataRoot) }), 'daily-learning: authenticated named route');
  ctx.effect(() => async () => {
    lifetime.abort();
    await activation;
    await service?.pending?.catch(() => {});
    await service?.routePending?.catch(() => {});
    await store?.close();
  }, 'daily-learning: cancel and release data root');
}
