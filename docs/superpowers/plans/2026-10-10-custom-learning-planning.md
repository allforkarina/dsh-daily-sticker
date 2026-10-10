# 自由文本学习需求与阶段路线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本计划采用当前会话顺序实施，各任务验证通过后再进入下一项。

**Goal:** 发布 `dsh-daily-learning@0.2.0`：用户分别粘贴四类学习需求，宿主模型生成可重新调整的完整阶段路线，每天按时间预算细化任务，并依据完成勾选推进。

**Architecture:** 需求草稿放入现有偏好，已生成路线独立保存，并保留版本。纯函数计算当前阶段，模型只生成路线内容及每日任务，路线标识、进度和持久化由插件控制。复用现有宿主 LLM、认证 RPC、本地原子存储和备忘录面板，不引入外部服务或学习记录系统。

**Tech Stack:** Node.js 24、TypeScript 类型擦除、React lazy-CJS Client、现有 DSH 0.2.0-rc.2 Host API、Node test runner、Playwright/Edge。

**已批准设计：** `docs/superpowers/specs/2026-10-10-custom-learning-planning-design.md`。

**工作目录：** `D:\Files\Projects\DSH_Plugin\DailyPlan_Sticker`。

---

## 交付边界与使用流程

1. 用户在设置中选择宿主规划模型，为某类任务粘贴自由文本需求。
2. 保存需求，再明确点击该类“生成路线／重新生成路线”。
3. 模型整理整体目标、规划假设、所有阶段、阶段目标和预计天数；生成成功后激活新版本。
4. 每天沿当前阶段生成一个符合该类别预算的小任务。完成勾选只用于安排后续任务，不代表知识掌握评测。
5. 用户改变方向时修改需求并重新生成路线。旧版本和旧任务保留，新路线独立计算进度。
6. 已有今天的任务不自动替换；点击“重新规划未完成项”后应用新路线，已完成任务保留。

清空某类需求并保存表示停用该类自定义路线，activeId 置 null，历史版本仍保留；后续生成回到默认规划。其他类别不变。

不增加聊天导入、笔记总结、学习记录回填、逐步骤勾选、知识掌握评分或项目管理页面。

## 文件职责

| 文件 | 操作与职责 |
| --- | --- |
| `src/learning.ts` | 新建：路线类型、校验、预算、阶段位置及需求变化判断；无宿主或 Node 依赖，可被 Client 复用。 |
| `src/route-planner.ts` | 新建：单类别需求到完整路线的模型调用、输出校验、一次修复和取消处理。 |
| `src/learning-client.cjs` | 新建：自由文本输入、路线生成按钮、当前及历史路线展示。 |
| `src/domain.ts` | 修改：偏好默认值、需求校验、任务路线快照、阶段模板及复制 Prompt。 |
| `src/store.ts` | 修改：旧数据升级、路线版本保存和路线 Markdown 快照。 |
| `src/service.ts` | 修改：保存需求、生成路线的并发保护、全历史阶段计算。 |
| `src/host.ts` | 修改：共用宿主模型适配函数，增加生成路线 RPC，传递完整路线。 |
| `src/routes.ts` | 修改：统一请求正文大小限制，支持四类长中文文本。 |
| `src/planner.ts` | 修改：每日规划遵循当前路线；模型失败时保持阶段模板。 |
| `src/sources.ts` | 修改：算法选题、AI 资讯检索和缓存使用当前阶段方向。 |
| `src/client.cjs`、`src/client.css` | 修改：接入新设置组件、任务阶段信息、生成状态及保存提示。 |
| `scripts/build.mjs` | 修改：Host 构建新模块，Client 内嵌纯路线模块和新组件。 |
| `tests/learning.test.mjs` | 新建：路线结构、进度、更新、完成记录及长文本校验。 |
| `tests/route-planning.test.mjs` | 新建：模型路线生成、修复、失败、取消及并发提交。 |
| `tests/core.test.mjs`、`tests/planning.test.mjs`、`tests/routes.test.mjs` | 修改：迁移、每日任务、资料选择与认证大小限制回归。 |
| `scripts/dev-entry.mjs` | 修改：隔离模型夹具支持路线和每日任务两种调用。 |
| `scripts/browser-learning-routes.mjs` | 新建：实际 DSH 面板的完整操作验收。 |
| `README.md`、`docs/install.md`、`docs/recovery.md`、`docs/acceptance.md`、`docs/publish.md` | 修改：新功能、更新方式、数据兼容及实测证据。 |
| `package.json`、`lib/`、`release/` | 发布阶段更新：0.2.0 元数据、预构建代码及发行包；依赖不变时保留现有 `pnpm-lock.yaml`。 |

当前已有未提交的 `scripts/browser-install-github.mjs` 和 `docs/screenshots/npm-install.png`，先检查并保留，不把旧验收素材当作本次功能通过的证据，不覆盖来源不明的改动。

## 统一数据与接口约定

以下是本次新增字段的唯一命名。实现中不另建进度计数器。

```ts
type Category = 'algorithm' | 'llm' | 'agent' | 'explore';
type Budget = { minMinutes: number; maxMinutes: number };
type LearningStage = {
  id: string;
  title: string;
  goal: string;
  estimatedDays: number;
  focus: string[];
  searchTerms: string[];
};
type LearningRoute = {
  id: string;
  category: Category;
  createdAt: string;
  request: string;
  budget: Budget;
  goal: string;
  assumptions: string[];
  stages: LearningStage[];
};
type RouteBook = Record<Category, {
  activeId: string | null;
  versions: LearningRoute[];
}>;
type LearningContext = {
  routeId: string;
  stageId: string;
  request: string;
  routeGoal: string;
  stageTitle: string;
  stageGoal: string;
  review: boolean;
};
type RoutePosition = {
  stage: LearningStage;
  completedDays: number;
  complete: boolean;
};
```

- `Preferences.learningRequests`：四类字符串，默认均为空，每类最多 12000 字符。
- `State.routes`：`RouteBook`。旧路线保留在该类 `versions` 中。
- `Task.learning`：可选 `LearningContext`，记录生成该任务时的需求、路线和阶段；历史 Prompt 不误用新路线。
- 存储升级为 `schemaVersion: 2`。先完整校验旧数据，备份成功后原子升级。0.1.0 不支持新版存储，回退前需用升级备份恢复到单独目录。
- `activeRoute(book, category): LearningRoute | null`、`routePosition(route, history, beforeDate): RoutePosition`、`budgetFor(prefs, category): Budget`、`emptyRouteBook(): RouteBook` 定义在 `src/learning.ts`。
- `parseRouteOutput(raw, category, request, budget, identity): LearningRoute` 定义在 `src/learning.ts`；`identity` 由服务提供 `{ id, createdAt }`。
- `generateRoute(input, options): Promise<LearningRoute>` 定义在 `src/route-planner.ts`。`input` 为 `{ category, request, budget, previous, recentCompleted, identity }`；`options` 为 `{ generate, signal }`，`generate` 使用现有 `(system, input, signal) => Promise<string>` 协议。
- `DailyService.generateRoute(category, revision)`：仅以已保存需求生成，提交时采用发起请求的 revision，不读取并合并新的 revision。
- `planDay` 的 `options` 增加可选 `routes: RouteBook`；保留原有函数参数，旧测试及默认行为继续有效。
- 新 RPC `routeGenerate` 的 payload 为 `{ category, revision }`，结果沿用现有 `snapshot()` envelope。
- `MAX_REQUEST_BYTES = 262144`，定义在 `src/learning.ts`，Host 和 HTTP 正文检查共用。四类中文需求、角色文本和现有偏好合计最坏约 216 KB，低于 256 KiB。

## Task 1：路线模型与长文本偏好

**Files:** Create `src/learning.ts`, `tests/learning.test.mjs`; modify `src/domain.ts`。

- [ ] 写失败测试，证明旧偏好可补默认值、中文需求可保存、超长及未知类别被拒绝。

```js
test('legacy preferences receive empty requests and accept long Chinese text', () => {
  const legacy = defaults();
  delete legacy.learningRequests;
  const prefs = validatePreferences(legacy);
  assert.deepEqual(prefs.learningRequests,
    { algorithm: '', llm: '', agent: '', explore: '' });
  prefs.learningRequests.llm = '学习 Attention，偏手算与代码实验。\n'.repeat(300);
  assert.equal(validatePreferences(prefs).learningRequests.llm,
    prefs.learningRequests.llm.trim());
  assert.throws(() => validatePreferences({ ...prefs,
    learningRequests: { ...prefs.learningRequests, llm: '学'.repeat(12001) } }));
});
```

- [ ] 运行 `node --test tests/learning.test.mjs`，确认缺少字段及函数导致失败。
- [ ] 实现上述类型和纯函数。`learning.ts` 不引用 `domain.ts` 的运行时代码，避免 Client 内嵌循环依赖。偏好按类别合并默认值，拒绝数组、非字符串及未知键；保留换行和 Markdown，仅 trim 首尾。
- [ ] 路线模型输出只允许 `{goal, assumptions, stages}`，阶段只允许 `{title, goal, estimatedDays, focus, searchTerms}`。限制：1–60 阶段、每阶段 1–365 天、目标至多 2000 字符、阶段标题 180、阶段目标 1200、假设至多 12 条各 600、focus 至多 8 条各 300、searchTerms 至多 8 条各 100。禁止模型创建路线 id、日期、进度及任意 URL。应用赋予阶段 `s1`、`s2` 等 id。

```ts
const stages = output.stages.map((stage, index) => ({
  ...validatedStage(stage),
  id: `s${index + 1}`
}));
return { id: identity.id, createdAt: identity.createdAt,
  category, request, budget, goal, assumptions, stages };
```

`validatedStage` 在同一任务中实现，逐项执行上述精确键、长度、整数和数组校验；无效输出一律报错，不截断路线伪装成完整规划。

- [ ] 运行新测试及 `node --test tests/core.test.mjs`，均须通过；提交 `feat: define custom learning route contracts`。

## Task 2：阶段推进的纯函数

**Files:** Modify `src/learning.ts`; test `tests/learning.test.mjs`。

- [ ] 写失败测试：两天内一天完成、一天未完成，阶段预计两天时仍留在该阶段；补第二个完成日期后进入下一阶段；取消第一天勾选后重新回到第一阶段。补充旧路线 id 不计入新路线、同日期不重复计数、全路线结束进入复习、未来日期不影响过去计划的测试。

```js
test('progress uses completed dates and reverses after unchecking', () => {
  const route = learningRouteFixture({ firstStageDays: 2 });
  const first = learningPlanFixture('2026-10-10', route, 's1', true);
  const second = learningPlanFixture('2026-10-11', route, 's1', false);
  assert.equal(routePosition(route, [first, second], '2026-10-12').stage.id, 's1');
  second.tasks.find(t => t.category === route.category).done = true;
  assert.equal(routePosition(route, [first, second], '2026-10-12').stage.id, 's2');
  first.tasks.find(t => t.category === route.category).done = false;
  assert.equal(routePosition(route, [first, second], '2026-10-12').stage.id, 's1');
});
```

测试文件内实现 `learningRouteFixture`：固定 route id `r1`、类别 llm、预算 30、两个阶段 `s1`/`s2`；实现 `learningPlanFixture`：使用 `makeTemplate` 创建四项计划，在 LLM task 填对应 `learning` 和 `done`。夹具仅表达输入，不调用待测试的推进函数。

- [ ] 运行 `node --test tests/learning.test.mjs`，确认推进测试失败。
- [ ] 实现按路线 id、类别、阶段 id 过滤的日期集合，不累加持久化计数。

```ts
const completed = new Set(history
  .filter(plan => plan.date < beforeDate)
  .filter(plan => plan.tasks.some(task => task.category === route.category
    && task.done && task.learning?.routeId === route.id
    && task.learning.stageId === stage.id))
  .map(plan => plan.date));
```

从第一个阶段起找完成日期数小于 `estimatedDays` 的阶段；全部完成返回最后阶段和 `complete: true`。同一天显式重新规划只参考之前日期，避免今天完成任务时跳过其他尚未完成项。

- [ ] 运行测试通过；提交 `feat: derive learning stage from daily completions`。

## Task 3：旧数据升级与路线保存

**Files:** Modify `src/store.ts`; tests `tests/core.test.mjs`, `tests/learning.test.mjs`。

- [ ] 新建真实 schema 1 状态夹具：旧角色、工程项目、一天已完成任务；打开新版 store 后断言 schema 2、新需求为空、新 routes 为空，旧字段及完成状态不变。再修改路线并重开，断言所有版本和 activeId 恢复。

```js
const before = JSON.parse(await readFile(stateFile, 'utf8'));
const store = await LocalStore.open(root);
const after = await store.read();
assert.equal(after.schemaVersion, 2);
assert.equal(after.days[day].tasks[0].done, before.days[day].tasks[0].done);
assert.equal(after.preferences.roles.llm, before.preferences.roles.llm);
assert.deepEqual(after.routes, emptyRouteBook());
await store.close();
```

- [ ] 运行 core 测试确认升级行为尚不存在。
- [ ] 分离旧数据校验与新版正规化。`validateState` 必须使用 `validatePreferences` 返回值，而不是像目前那样校验后丢弃补充的默认值；检查 route category、唯一 id、activeId 引用和 task 的可选路线快照。
- [ ] 在持有 writer lock 后，先校验完整旧状态，再将原始字节写入 `backups/state-v1-before-0.2.0-<uuid>.json`，最后原子写新版 `state.json`。备份或校验失败不得修改旧状态。新目录直接初始化 schema 2。
- [ ] 在 `routes/<category>/<routeId>.json` 和 `.md` 输出可读路线快照；权威仍为 state.json，快照失败沿用现有 warning 机制，不伪装成状态保存失败。Markdown包含需求、预算、目标、假设、阶段及预计天数，不包含宿主密钥或完整网页正文。
- [ ] 运行 core 和 learning 测试，包含未来 schema 拒绝且保留原文件的回归；提交 `feat: migrate local store and persist route versions`。

## Task 4：模型生成完整路线及安全提交

**Files:** Create `src/route-planner.ts`, `tests/route-planning.test.mjs`; modify `src/service.ts`, `src/host.ts`, `src/routes.ts`, `tests/routes.test.mjs`。

- [ ] 写失败测试：模型收到长文本、预算、旧路线和已完成摘要；返回结构合格路线。非法 JSON 最多修复一次；失败保留旧路线；无模型明确拒绝；取消非协作 provider 能结束；生成期间保存新需求使旧结果提交冲突。

```js
test('route generation preserves request and assigns local identities', async () => {
  let captured;
  const route = await generateRoute(routeInputFixture(), {
    signal: new AbortController().signal,
    generate: async (system, input) => {
      captured = JSON.parse(input);
      return JSON.stringify({ goal: '理解注意力并做实验', assumptions: ['未提供学习期限'],
        stages: [{ title: 'QKV', goal: '解释三个向量', estimatedDays: 2,
          focus: ['手算一个例子'], searchTerms: ['Attention QKV'] }] });
    }
  });
  assert.equal(captured.category, 'llm');
  assert.equal(captured.budget.minMinutes, 30);
  assert.equal(route.id, 'r-test');
  assert.equal(route.stages[0].id, 's1');
});
```

`routeInputFixture` 在该文件定义为 category llm、非空中文需求、30 分钟预算、previous null、recentCompleted 空、identity `{id:'r-test',createdAt:'2026-10-10T00:00:00Z'}`。

- [ ] 运行 `node --test tests/route-planning.test.mjs tests/routes.test.mjs`，观察新行为失败。
- [ ] 实现路线提示词：提取目标、已明确基础、方向偏好；给完整阶段和预算估算；无基础信息说明假设；算法不创建题号或 URL；资讯路线规划主题不提前编造新闻；完成记录不等于掌握。模型输出交给 Task 1 的 `parseRouteOutput`。

工程预算为区间时，以 minMinutes 估算阶段天数，并在 assumptions 中说明；每日实际任务仍使用原 min/max 范围。不要把每天 60–120 分钟误写成固定 120 分钟。
- [ ] 复用 `abortable`，总超时 120 秒、最多一次结构修复、输出最多 128000 字符。修复失败抛出可读错误；不得把路线生成失败转为成功模板。

路线输入 JSON 明确包含 `kind: 'route'`，供隔离夹具区分调用。现有 `streamText` 固定限制 48000 字符，改为 `streamText(stream, maxChars = 48000)`；路线调用传 128000，每日调用保留 48000，不扩大每日输出限制。
- [ ] 服务新增单航班路线生成操作；开始时读 state，保存 revision、需求、budget、previous、最近最多 30 条该类已完成摘要。生成成功后仅在原 revision 上追加 route 并设置 activeId；不覆盖 days 或其他类别路线。

```ts
const revisionAtStart = state.revision;
const route = await this.routeGenerator(input);
state.routes[category].versions.push(route);
state.routes[category].activeId = route.id;
await this.store.commit(revisionAtStart, state);
return this.snapshot();
```

`routeGenerator` 作为 `DailyService` 新的可选构造依赖追加在现有参数之后，旧构造调用不改变。没有依赖时拒绝路线生成并提示配置模型。`snapshot` 增加 `routeGenerating` 类别，所有后台操作结束后清理该状态。

保存偏好时，清空需求的类别同步设置 activeId 为 null，保留其 versions；非空需求变更不自动激活新路线。增加这两种分支的服务测试。Host 卸载时取消 lifetime，并等待每日 pending 及路线 pending 两个操作结束后再关闭 store。

- [ ] Host 提取 `generateWithHost(system, input, signal, maxChars = 48000)`，路线和每日任务共用当前 `resolveCallConfig`＋`streamText`，路线适配闭包固定传 128000。新增严格 `routeGenerate` action；将 HTTP header、流式正文和 Host payload 大小统一为 `MAX_REQUEST_BYTES`，认证检查仍在读取正文之前。更新边界测试为 262144 字节，超限 413。
- [ ] 全部相关测试通过；提交 `feat: generate learning routes through host model`。

## Task 5：每日任务使用路线及历史快照

**Files:** Modify `src/domain.ts`, `src/planner.ts`, `src/service.ts`, `src/host.ts`; tests `tests/learning.test.mjs`, `tests/planning.test.mjs`, `tests/core.test.mjs`。

- [ ] 写失败测试：自定义 Attention 路线不被内置 Prompt 起点覆盖；未完成继续、完成到天数进入下一阶段；路线更新只影响后续生成；今天已完成任务强制重规划后保持原任务；模型失败显示当前阶段；复制历史 Prompt 使用任务自己的旧学习需求。

```js
const prefs = defaults();
const base = makeTemplate(day, prefs, history, [], routes);
assert.match(base.tasks[1].title, /QKV/);
assert.equal(base.tasks[1].learning.routeId, route.id);
assert.equal(base.tasks[1].learning.stageId, 's1');
const changedPrefs = { ...prefs,
  learningRequests: { ...prefs.learningRequests, llm: '改学推理部署' } };
assert.match(promptFor(base.tasks[1], changedPrefs), /原来的 Attention 需求/);
```

这里的 `route`、`routes`、`history` 使用 Task 2 明确定义的测试夹具，并令 route.request 为“原来的 Attention 需求”。

- [ ] 运行 learning、planning、core 测试，确认路线还未参与生成。
- [ ] 服务传入全部历史用于 `routePosition`，不能沿用目前 `.slice(0,30)` 作为完整进度来源；模型只收到最近 7 天摘要，资料去重仍保留最近 30 天。
- [ ] `makeTemplate` 增加最后一个可选 `routes` 参数。自定义 LLM/Agent 标题和目标来自当前阶段；算法与资讯保持真实来源限制，并加当前阶段方向。全部阶段完成时标题标记复习/综合实践，不自动重新开始路线。
- [ ] 每日 system 明确“自定义路线优先，内置模板仅为回退”。上下文增加当前路线和阶段；模型不得修改 routeId、stageId、预算、done。`validateCandidate` 从 base 保留这些应用字段；输出仍只允许现有四类别任务结构。
- [ ] 复制 Prompt 加入任务保存的 `learning` 上下文；无路线的旧任务继续当前行为。角色风格仍可采用当前设置，不改变历史任务的路径语义。
- [ ] 新旧测试通过；提交 `feat: plan daily tasks from active learning stages`。

## Task 6：算法和资讯检索真正使用路线

**Files:** Modify `src/sources.ts`; tests `tests/planning.test.mjs`。

- [ ] 写失败测试：AI 检索 query 含阶段 searchTerms 而不是仅旧 interests；更新路线后不复用旧方向的文章缓存；算法在已验证题库中选择阶段搜索返回的题，拒绝伪造 slug、Hard、付费题及外站链接。

```js
let query;
const web = { search: async input => { query = input.query; return {sources: []}; } };
await collectArticles(web, prefs, day, signal, { searchTerms: ['KV Cache', '推理优化'] });
assert.match(query, /KV Cache/);
assert.match(query, /推理优化/);
assert.doesNotMatch(query, /旧的 unrelated 兴趣/);
```

测试中 prefs.interests 设置为“旧的 unrelated 兴趣”，signal 使用新 AbortController。新增可选最后参数为 `{ searchTerms: string[] }`，保留旧调用。

- [ ] 运行 planning 测试，确认阶段检索尚不存在。
- [ ] 将当前阶段 searchTerms、阶段标题和明确预算作为检索方向。AI 无自定义路线时使用现有 interests；有路线时优先阶段关键词，保留 7/30 天窗口、正文读取及未知日期提示。
- [ ] 算法有路线时先用宿主 web 搜索 `site:leetcode.<site>/problems/ <阶段关键词>`，只接受对应 LeetCode 域名的正常 HTTPS `/problems/<slug>/` 链接；再把 slug 与已有 `/api/problems/all/` 元数据交叉验证。搜索返回的题号、标题、难度不当作验证结果。无匹配时可选现有真实题，但必须在任务 notices 标明“未找到符合当前阶段的已验证题目，提供通用练习”，不能假称符合方向。
- [ ] 来源缓存键加入算法/资讯 activeRoute id 和当前 stage id；预算不影响检索内容时不加入。旧缓存缺少新键且当前有路线时不得当作新方向缓存。

`collectSources` 增加最后一个可选参数 `routes: RouteBook = emptyRouteBook()`；从 full history 计算阶段，资料去重单独使用最近 30 天。Host 的 sources 闭包明确传入当前 state.routes，避免检索仍使用空路线。`collectArticles` 的旧调用继续走现有 interests 分支。
- [ ] 测试 source failure、缓存恢复和未匹配提示，全部通过；提交 `feat: align verified sources with learning routes`。

## Task 7：设置界面与路线展示

**Files:** Create `src/learning-client.cjs`; modify `src/client.cjs`, `src/client.css`, `scripts/build.mjs`。

- [ ] 在隔离 UI 夹具中建立四类需求输入和路线结果示例，先写 Task 8 的浏览器操作断言，确认当前面板缺少对应控件。
- [ ] 新组件 `LearningSettings({view, requests, onRequestsChange, api, onReload, onCommitted, onError, disabled})` 使用共享 React 和现有 h/Button；嵌入“学习需求与路线”区域，四类折叠显示。textarea 设置 maxLength 12000、至少 6 行，提示可粘贴需求而无需写准确规划。
- [ ] 保存仍使用现有 Settings 的 preferences 保存流程。未保存草稿显示“先保存需求”；生成按钮仅在对应需求非空、已保存、数据目录未改变、模型已选且无进行中写操作时可用。调用：

```js
const committed = await api.call('routeGenerate', {
  category,
  revision: view.state.revision
});
onCommitted(committed);
await onReload();
```

`onCommitted` 由 Settings 提供，生成时不存在未保存草稿：更新 `baseRevision.current`、`basePreferences.current` 和 prefs 为 committed.state。否则同一设置页面中生成路线后再保存其他偏好会误用旧 revision。将“生成路线后不关闭设置，直接修改预算并保存”加入 UI 回归。

- [ ] 生成调用扩展 Client 超时到至少 135 秒，或沿用显式传入的 AbortSignal；退出组件时停止更新局部 UI，不将 Client 超时伪装成服务提交失败。服务端超时仍由 Task 4 的 signal 控制。操作期间禁用重复生成和其他会改 revision 的按钮。
- [ ] 展示总体目标、假设、各阶段目标和预计天数，当前/已完成状态、生成预算以及历史版本。需求与 route.request 不同显示“需求已修改，路线尚未更新”；预算不同显示重新估算提示。新增路线完成提示；不做日历、统计或掌握度图表。
- [ ] 任务卡显示对应阶段；复制 Prompt 及来源链接仍可用。显示“路线更新后可重新规划今日未完成项”。历史任务展示自己的路线快照，不显示新路线阶段。
- [ ] 构建 Client 先内嵌 stripped `learning.ts` 闭包，再处理 `domain.ts` 的 learning import，注入相同纯函数；最后拼入 `learning-client.cjs` 和原 client.cjs。仅打包 React 宿主引用，不增加第二份 React 或浏览器对 Node 模块的依赖。
- [ ] `node scripts/build.mjs` 成功；在隔离 DSH 中检查明暗主题、窄宽布局和角色设置仍可用；提交 `feat: add free-text requirements and route controls`。

## Task 8：实际 DSH 面板验收

**Files:** Modify `scripts/dev-entry.mjs`; create `scripts/browser-learning-routes.mjs`; update `docs/acceptance.md`。

- [ ] 夹具按输入的 `kind: 'route'` 或每日模板区分调用：路线返回完整阶段结构；每日返回对应阶段任务。保留“本地夹具，不调用外部模型”的明确标记。合成来源不得被报告为真实模型效果。
- [ ] 浏览器脚本使用现有 Playwright runtime 和 `/daily-test-entry`，只操作 `.test-runtime/home` 的独立 profile 及新建数据目录。断言如下流程：

```js
await page.getByLabel('LLM 学习需求', { exact: true }).fill('想理解 Attention，偏手算与实验。');
await page.getByRole('button', { name: '保存设置', exact: true }).click();
await page.getByRole('button', { name: '生成 LLM 路线', exact: true }).click();
await page.getByText('路线已生成', { exact: true }).waitFor();
await page.reload();
await page.getByRole('button', { name: '每日学习', exact: true }).click();
await page.getByText('QKV', { exact: true }).first().waitFor();
```

按钮可访问名称固定为“生成 <类别> 路线”或“重新生成 <类别> 路线”，文本提示区分需求保存和路线生成成功。重载后沿用现有欢迎/API 配置弹窗处理。

- [ ] 补充完整验收：长中文保存；重启需求和路线恢复；点击重新规划应用当前阶段；完成勾选后次日阶段变化；改变需求生成新 routeId、旧路线可查看；新路线失败不替换；编辑期间 revision 冲突提示；已完成任务不改；复制历史 Prompt 的需求未串线。
- [ ] 通过注入时钟的服务测试验证跨日，不修改操作系统时间或生产数据。UI 验证明暗主题、850px 宽度、打开历史日期不触发今日付费规划。
- [ ] 保存 `docs/screenshots/learning-route-settings.png`、`learning-route-memo.png` 和实际结果说明；只报告亲自验证的项目。真实模型规划质量留给用户更新后的反馈，夹具通过不代表模型质量保证。
- [ ] 运行完整测试和原有 browser-smoke 回归；提交 `test: verify route workflow in isolated DSH`。

## Task 9：文档、版本和发布包

**Files:** Modify `package.json`, `README.md`, `docs/install.md`, `docs/recovery.md`, `docs/publish.md`, `docs/acceptance.md`, `scripts/audit-package.mjs`; regenerate `lib/`; add `release/dsh-daily-learning-0.2.0.tgz`。

- [ ] README 写明“自由文本需求 → 生成阶段路线 → 每日任务 → 完成推进 → 改需求重新生成”的使用流程、预算估算和失败降级。移除“只支持内置路线”的旧描述。
- [ ] recovery 写清 schema 1 升级备份、schema 2 对旧插件的兼容限制；卸载不删数据，安装新版后重选原目录恢复。不要建议直接用 0.1.0 打开 schema 2 数据。
- [ ] 将 package.version 提升到 0.2.0；不变更已核实的宿主 peer versions。已检查 lockfile 没有项目自身版本，依赖不变时无需修改。旧 0.1.0 发行包保留为历史发行，不覆盖。
- [ ] 修改当前硬编码 0.1.0 的包审计入口，使用显式参数或 package.version 对应的默认包，并断言包内 package.json 的版本：

```js
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const tarPath = process.argv[2] || `dist/${manifest.name}-${manifest.version}.tgz`;
const buffer = gunzipSync(await readFile(tarPath));
// 保留现有 tar entries 读取与内容检查。
assert.equal(JSON.parse(entries.get('package/package.json')).version, manifest.version);
```
- [ ] 执行：

```powershell
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/package.mjs
node scripts/audit-package.mjs dist/dsh-daily-learning-0.2.0.tgz
git diff --check
```

预期全部测试通过，包包含新增 lib 模块及现有 patch，不含 src、tests、dev-entry、测试数据、密钥或 node_modules。

- [ ] 使用唯一 0.2.0 tarball 路径在独立 DSH profile 安装，验收入口、迁移、模型配置和 Host 重启恢复。生成 release 副本并核对两份 SHA-256 相同；提交 `release: prepare dsh-daily-learning 0.2.0`。

## Task 10：发布、远端安装与用户更新说明

**Files:** Update `docs/acceptance.md`, `docs/publish.md`, `docs/install.md`；使用现有 GitHub remote 和 npm 官方源。

- [ ] 发布前核对 git diff、包文件列表和授权范围。向既有 GitHub main 正常推送，禁止 force push。用户已授权发布，不额外创建 PR 或账号。
- [ ] 用 npm 官方源检查当前身份和目标版本。若 0.2.0 已被占用，不尝试覆写，先核对是谁发布及包内容。发布前执行绝对路径 dry-run：

```powershell
$releaseTar = (Resolve-Path -LiteralPath '.\dist\dsh-daily-learning-0.2.0.tgz').Path
npm publish $releaseTar --dry-run --access public --registry=https://registry.npmjs.org/
npm publish $releaseTar --access public --registry=https://registry.npmjs.org/
```

不能用 `dist/file.tgz` 裸相对路径，之前 npm 曾将其当成 GitHub shorthand。需要设备 2FA 时通过标准 npm 浏览器流程完成，不读取或要求用户发送密码、验证码、token、恢复码。

- [ ] 验证公开元数据与本地 pack 的 shasum、version、dsh.bundle.patch 一致：

```powershell
npm view dsh-daily-learning@0.2.0 version dist.shasum dsh --json --prefer-online --registry=https://registry.npmjs.org/
```

短暂处理状态允许有限重试；publish 成功输出不等于远端已可安装，必须查到目标版本。

- [ ] 实际隔离 GUI 输入 `dsh-daily-learning@0.2.0`、npm 官方源，检查入口和新增设置。核对当前 DSH plugin manager 的更新能力；支持更新时给用户准确操作，不支持时提供正式卸载再安装步骤并保留原 dataRoot，不能猜测不存在的更新按钮。
- [ ] 在独立已有 0.1.0 数据的 profile 演示更新后重启、路线配置可用、旧任务和角色保留。GitHub 安装验证已推送新构建；网络问题不能被描述为源码不兼容。
- [ ] 记录 npm 公共版本及用户操作说明：更新到 0.2.0 → 重启 DSH → 原数据目录 → 设置宿主模型 → 保存自由文本需求 → 生成路线 → 重新规划今日未完成项。提交验收记录并正常推送。

## 检查点与验收覆盖

| 检查点 | 通过标准 |
| --- | --- |
| Task 1–3 | 中文需求、路线结构和阶段计算测试通过；旧数据无损升级及恢复。 |
| Task 4–6 | 模型、路线更新、取消、并发保护和实际检索方向测试通过。 |
| Task 7–8 | 实际 DSH 面板的新增流程及原有备忘录回归通过。 |
| Task 9 | 0.2.0 包内容正确，预构建代码可独立安装与重启。 |
| Task 10 | npm 官方源公开可获取且 DSH 隔离安装成功，GitHub 与新版本一致。 |

设计中的需求输入、完整路线、重生成、每日时长、完成推进、历史保留、模型失败、旧版迁移、资料真实性、Prompt 上下文以及 npm/GitHub 发布均有上述对应任务。不得仅完成 UI 文本框就宣布功能完成，也不得以夹具验证替代用户实际模型效果反馈。

本文件为实施计划；当前阶段只修改文档，尚未修改运行时代码或发布新版本。
