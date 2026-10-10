// Isolated verification helper. Never included in the published bundle/patch.
export const name = 'daily-learning-dev-entry';
export const inject = ['webServer', 'connection', 'llm', 'web'];
export function apply(ctx) {
  if (process.env.DSH_DAILY_TEST !== '1') return;
  let calls = 0;
  class FixtureAdapter {
    providerInfo(id) { return { id, name: 'Daily Test · 本地夹具' }; }
    providerRetryPolicy() { return undefined; }
    imageRequestPricing() { return undefined; }
    async resolveModel(provider, model) { return { provider, id: model, name: model }; }
    async prepareCall(provider, model) { return { model: await this.resolveModel(provider, model), stream: options => this.stream(options) }; }
    async listModels(provider) { return [{ provider, id: 'memo-fixture', name: 'Memo Fixture（不调用外部模型）' }]; }
    async *stream(options) {
      calls++;
      await writeFile(new URL('../.test-runtime/fixture-calls.json', import.meta.url), JSON.stringify({ calls }));
      const input = options.messages.find(m => m.role === 'user').content.find(c => c.type === 'text').text;
      const context = JSON.parse(input);
      const output = context.kind === 'route' ? JSON.stringify({
        goal: `${context.category === 'llm' ? 'Attention：手算与实验' : '分阶段学习'}（本地夹具，不调用外部模型）`,
        assumptions: ['隔离测试使用固定路线，不代表真实模型规划质量。', '没有提供基础和期限，按当前预算估算。'],
        stages: [{ title: 'QKV', goal: '解释 Query、Key、Value 并手算一个注意力例子。', estimatedDays: 1, focus: ['手算与代码实验'], searchTerms: ['Attention QKV'] }, { title: '推理优化', goal: '通过最小实验理解 KV Cache。', estimatedDays: 2, focus: ['实验比较'], searchTerms: ['KV Cache'] }]
      }) : JSON.stringify({ tasks: context.template.tasks.map(t => ({ category: t.category, title: t.category === 'llm' ? `模型规划 · ${t.title}` : t.title, summary: t.summary, steps: t.steps, acceptance: t.acceptance, sourceIds: t.sources.map(s => s.id) })) });
      yield { type: 'block-start', index: 0, blockType: 'text' };
      yield { type: 'text-delta', index: 0, text: output };
      yield { type: 'block-end', index: 0, block: { type: 'text', text: output } };
      yield { type: 'finish', reason: { kind: 'stop' } };
    }
  }
  ctx.llm.registerAdapter(['daily-test'], new FixtureAdapter());
  ctx.web.registerSearchProvider({ id: 'daily-test', available: () => true, search: async () => ({ sources: [{ url: 'https://arxiv.org/', title: '【隔离测试资料】AI 工具与研究' }], truncated: false }) });
  ctx.web.registerFetchProvider({ id: 'daily-test', available: () => true, fetch: async ({ url }) => ({ url, statusCode: 200, body: { kind: 'text', content: '这是隔离验收用的合成资料正文，不是真实研究结论。用于验证资料读取、来源绑定及生成流程。'.repeat(12) }, truncated: false }) });
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/daily-test-entry', handler(req, res) {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) { res.writeHead(403); res.end(); return; }
    res.writeHead(302, { Location: ctx.connection.authenticatedUrl(`http://127.0.0.1:${ctx.webServer.port}/`) }); res.end();
  } }), 'test-only loopback entry');
}
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
