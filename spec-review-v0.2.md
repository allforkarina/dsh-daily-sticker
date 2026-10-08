# DSH Daily Learning 规格审查报告（针对 v0.2-draft）

审查对象：`DSH Daily Learning — 插件功能与技术规格 v0.2-draft`（2026-10-08）
审查范围：① 规格内部矛盾/冲突；② 是否符合 DSH 插件开发规范（OFF-01 … OFF-09）与目标版本的真实能力。
审查日期：2026-10-08
核实基准：本机 DSH `0.2.0-rc.2`（commit `04f392c9`，cordis 4.0.4 / schemastery 3.18.4 / Node 24.21.0）+ 官方仓库 `deepseek-ai/deepseek-harness@master` 的 `docs/`。

---

## 0. 结论摘要

| 维度 | 结论 |
|---|---|
| 内部一致性 | 主体流程自洽，但存在 **7 处真实矛盾**（C-01、C-03、C-04、C-05、C-07、C-10、C-13）与 **多处理解歧义**（C-02、C-06、C-08、C-09、C-11、C-12、C-14 ~ C-25） |
| 与官方机制的一致性 | **OFF-01 ~ OFF-08 成立**（OFF-06 是字段写法、OFF-08 是工作量被低估）；**OFF-09 需要改写**——官方没有"复用宿主模型/不另存 API Key"的原句，可核实的是 `ctx.llm` + credentials seam |
| spec 对宿主能力的误判 | 三处，且都是**好消息**：① §4 担心的"没有合格面板扩展点"实际存在两个官方扩展点（且在装机版本里都已被插件用过）；② 宿主有 `ctx.web` 且本机 `deepseek-official` + `http` provider **已启用**；③ 模型路由有 `ctx.llm.listProviders/resolveCallConfig` 可用 |
| 最大阻断风险 | ① **C-25**：把 dataRoot 可写性做进 Config 校验 → 首装必然加载失败，而插件加载失败会波及整个 profile 组合；② **R2** 客户端产物必须自己复刻 lazy-CJS 构建；③ **R3** 固定面板语义（左栏全局面板 vs 右栏会话级标签）。R1（Host↔Client 通道）与 R4（依赖可得性）已实证消解 |
| 可验证性 | FR-01 / FR-07 / FR-08 无对应验收标准；§18、§20、§21 的需求无 FR 编号，无法逐条验收 |

---

## 1. 规格内部矛盾与冲突

约定：**矛盾** = 同一事项在两处规定不同，必须裁决；**歧义/缺口** = 只在一处定义或未定义，会造成实现分歧。

### 1.1 真实矛盾（必须裁决）

> 编号是全局唯一的：C-02、C-06、C-08、C-09、C-11、C-12、C-14 ~ C-25 属于"歧义与缺口"，列在 1.2，故本节编号不连续。

#### C-01 算法/AI 的"优先续学"规则自相矛盾 —— 高

- §8 FR-04（四类通用规则）："同类有活动未完成项时，优先显示"继续现有任务"；默认不继续生成新的序列任务。"
- §9 FR-05（分类规定）："算法：今日仍安排一项基础题；此前未完成的题目自动显示在今日续学/追加区，不覆盖今日基础题。""AI 探索：今日基础任务准备新内容；此前未完成内容自动显示在今日续学/追加区。"
- §22 AC-07："LLM/Agent 优先成为基础目标，算法/AI 保留在续学追加区。"
- §22 AC-09："同类有未完成活动项时优先续学，避免不断跳过当前目标。"（**无条件，含算法/AI**）

**冲突**：AC-09 与 §9、AC-07 对算法/AI 的规定相反。
**建议裁决**：AC-09 限定为 "LLM/Agent 类"；在 §8 通用规则中显式写出"算法/AI 例外：基础位始终为新目标，未完成项进续学区"。

#### C-03 配置的权威来源冲突：初次配置表单 vs dataRoot 内的 state.json —— 高

- §5 FR-01 把 **时区、dataRoot、planningModelRoute、LeetCode 站点、选题模式、LLM 当前节点、Agent 项目与路径、AI 兴趣标签、四类 Agent 角色**全部放进"初次配置表单"。
- §16 FR-12 把 `profiles/roles.json` 放在 dataRoot 下，并规定 `state.json` 为"完整业务状态，**权威来源**"，roles.json 为"**可重建快照**"。
- §19 FR-14："重启恢复同一份学习空间。" §21："卸载保留文件。"

**冲突**：同一批用户数据同时被定义为"宿主插件配置"和"dataRoot 内的业务状态"，但没有定义谁是权威。派生问题：
1. 两者不一致时以谁为准？
2. 卸载插件（配置保留或丢失）后用同一 dataRoot 重装，角色/时区/当前节点从哪恢复？
3. 角色正文在 §5 要求"配置"、在 §14 FR-10 要求"可编辑并且独立保存"、在 §16 要求"作为快照落在 dataRoot" —— 三个位置写作目标不同。

**建议裁决（按数据性质分层）**：
- 宿主配置（**profile 里本插件的挂载行 `config:`**，由宿主 ConfigEditor 写入、OFF-03 的 Schemastery 校验）：只放**环境/引导类**字段 —— `dataRoot`、`planningModelRoute`（可空）、`timezone` 初值、`autoPrepareOnOpen` 等 §20 列出的运行参数。
- dataRoot/state.json：**业务与用户数据** —— 角色正文、路线节点、学习目标、进度、操作历史。配置表单只作为首启的写入入口，写完后 state.json 权威。
- 明确"配置块缺失但 state.json 存在"时的恢复顺序（先读 state.json，配置块仅补齐环境字段）。
- 生态实测印证（见 2.5）：DSH 0.1.7 起已删除"插件可注册的设置命名空间"，插件偏好就是写在 profile 的挂载行上 —— 这正是"环境字段走挂载行"的依据。

#### C-04 历史"未完成"的判定口径冲突（当日快照 vs 截至查询时重算）—— 高

- §17 FR-13："历史未完成日：**截至查询时**，已有过去日期的计划，四项基础任务尚未全部完成。"并规定"跨日补完：保留真实完成时间，未来可区分最终完成与当日完成"。
- §9 FR-05："续学后勾选今日实例仅计入今日对应基础/追加完成数，旧日未完成实例**保留当日状态**并显示后续达成信息，**不自动补成历史打卡**。"同时"午夜后完成任务记录真实时间，但不会偷偷改写任务所属日期"。

**冲突**：旧日实例在次日甚至数日后被完成时，该日是否算"基础完成日"？§17 的"截至查询时"隐含重算，§9 禁止改写旧日打卡。二者的差别直接决定 AC-15/AC-16 与未来统计的正确性。
**建议裁决**：DayPlan 明确两组字段 ——
- `dayCompletion`（当日快照，冻结，用于"当日完成/未完成"）；
- `finalCompletion` / `lateCompletedAt`（后续达成，用于"最终完成"）。
统计口径写死不变量："基础完成日 = dayCompletion 四项全完成；追加完成情况单独统计；跨日补完只改 finalCompletion。"

#### C-05 初次配置的必填项 vs 无模型降级模式互斥 —— 高

- §5 FR-01：配置包含 `planningModelRoute`；"**配置完成前不产生模型规划请求**"。
- §20："缺少模型时可读历史、勾选和使用基础模板，智能追加显示模型配置入口。"

**冲突**：若 planningModelRoute 是完成配置的必要条件，宿主未配置任何模型时用户永远进不了工作台，§20 的降级模式不可达；若它不是必需，FR-01 的"配置完成前"就没有定义完成条件。
**建议裁决**：`planningModelRoute` 允许为 `null`（配置表单提供"暂不选择"），准备状态进入 `degraded`/模板模式；AC 补一条"无模型可用时四类仍可展示模板任务并勾选"。

#### C-07 跨天触发机制冲突（"次日首次打开" vs "跨日检查"），并隐含无人触发的模型调用 —— 高

- §6 FR-02："跨天不强制切换用户当前页面。"
- §7 FR-03：触发点为"工作台打开、**恢复前台、跨日检查**和用户主动准备今日计划"。
- §7 FR-03："跨天带入发生在**次日首次打开**；若次日未打开，则在下一次打开当天恢复。""**仅后台启动不生成缺席日期的计划。**"
- §20："**首次准备、重新规划和追加候选才使用规划模型。**"
- §3 暂不包含：系统通知、关机调度等自动行为。

**冲突**：应用整夜开着（不关闭、仅最小化）时，午夜是否自动生成新一天计划？"跨日检查"暗示定时/被动触发，"次日首次打开"暗示用户动作触发；若真的自动生成，就是一次无人触发的模型调用，与 §3 的排除项与 §20 的成本口径都不一致。
**建议裁决**：跨日只做"检测 + 前台提示 + 一键准备"，生成动作必须由用户前台动作触发；或明确允许定时生成并补齐节流、失败与并发规则。

#### C-10 §15 的"恢复"操作在 §20 业务操作中缺失 —— 中

- §15 FR-11："开始、完成、暂缓、**恢复**、重开和替换由用户界面操作。"
- §20 业务操作清单：`ensureTodayPlan、getTaskDetail、markStarted、confirmCompletion、recordProgress、reopenTask、deferTask、editTask、replaceTask、previewNextTask、addNextTask、updateRoleProfile、buildLearningPrompt、getHistory`。

**冲突**：没有 `resumeTask`/`undeferTask`，"恢复"无法实现；"取消完成"（§6）与 `reopenTask` 是否同一操作也未定义。
**建议裁决**：补 `resumeTask(taskId)`；明确"取消完成 = reopenTask 且保留历史操作"。

#### C-13 名称/身份标识三处不一致 —— 中

- 文档名 `DSH Daily Learning`、插件暂定名 `dsh-daily-learning`、工作区目录 `DailyPlan_Sticker`、模块名前缀 `DailyLearning*`。
- §7 FR-03 的唯一键是 `learningSpaceId + localDate`；§21 要求发行包声明 bundle/patch。

**冲突/风险**：插件包名决定 profile 配置块键名与 bundle 标识；rename 会造成"配置块不匹配 → 旧配置静默失效"。工作区名与插件名不同会让后续开发者误判目录用途。
**建议裁决**：写 plan 前一次定名（npm 包名 / bundle 名 / profile 配置键 / dataRoot 子目录名 / 文档标题），并在规格里登记为常量表。

### 1.2 歧义与缺口（会造成实现分歧，但非两处对写）

| ID | 位置 | 问题 | 建议 |
|---|---|---|---|
| C-02 | §7 FR-03 步骤 2–4 | 先"按四类建立基础任务位置"，再"检查未完成 work item 纳入续学""依据路线挑选目标"，但 FR-03 本身没说哪几类的**基础位**由续学项占用（只在 §9 分散规定），实现者容易给 LLM/Agent 也生成新基础任务，导致一个 workItem 两个身份 | 在 FR-03 内写明：LLM/Agent 基础位优先由续学目标占据；算法/AI 基础位始终是新目标 |
| C-06 | §8 / §9 / §15 / §18 | "暂缓（deferred）"与"暂停自动带入（carryPolicy=paused）"语义重叠：§8 说只有"暂缓且明确不自动带入"才留在待恢复列表，§9 说"各类暂缓目标保留在待恢复列表；默认自动带入"。界面上这两个开关的关系、暂缓项是否仍显示在今日面板，均未定义 | 统一：`deferred` 只表示"今日不推进"；`carryPolicy` 决定跨天是否带入；"待恢复列表 = carryPolicy=paused 的集合"，并规定暂缓项在今日面板的展示位置 |
| C-08 | §5 / §12 / §21 | 读取权限自相矛盾：§5"不授予插件自动扫描项目权限"，§12 却要求给出"相关模块/文件位置"并区分"未经读取的位置标为待定位"，§21 只约束写入范围。**谁去读**（插件读本地 / 外部模型凭仓库 URL 推断）没有定义 | 明确读取边界：本地项目默认不读；位置信息来自用户提供或远端仓库 URL；如要读，定义授权、范围、日志脱敏 |
| C-09 | §10 FR-06 vs §18 | FR-06 要求保存"站点、题号、slug、标题、难度、标签、官网链接和验证时间"，但 §18 的 `Source` 只有"URL、标题、作者/机构、发布时间、检索时间、验证状态"，`WorkItem` 只有不透明的 `problemRef` → 这些字段**在数据模型里无处安放**，而 AC-04 又依赖"难度已验证" | 补 `ProblemRef` 实体（site、frontendId、slug、title、difficulty、tags、url、verifiedAt、cacheFetchedAt），并让 AC-04 引用它 |
| C-11 | §22 AC-03 vs §7/§13/§19 | AC-03 要求每类基础任务都含"所需来源"，但来源失败时该类可以是 `degraded`，AI 探索在无网无缓存时只给"已保存的工具练习或技巧"（没有 URL/作者/发布时间），此时 AC-03 无法判定 | AC-03 加例外：degraded 时允许来源为空但必须显式标注缺失原因与缓存时间 |
| C-12 | §8 / §9 / §6 | 未完成项无限顺延且无每日带入上限："四类未完成追加项都必须保存并自动进入次日续学视图"+"多项未完成目标按创建顺序排队"，而 §6 要求主体是"一项基础 + 零到多项追加" → 长期欠账会把今日面板占满，稀释"每日四项基础"这个产品核心 | 定义每类每日带入上限（建议 1 项续学 + 其余折叠为"待恢复 N 项"计数），并说明计数如何影响完成率展示 |
| C-14 | §16 vs §19 | dataRoot 允许是"用户选择的任意持久目录"，若用户选在云同步盘/网络盘，"同一 dataRoot 只允许一个 Host 写入者"的前提被破坏（多机同步 = 多写入者） | 在 §5 校验中加"本地固定磁盘、非同步/网络路径"检查，或明确多写入者的冲突策略 |
| C-15 | §6 vs §7 | §6 把"替换任务"列为通用操作，§7 限定"有未完成任务时可以编辑、续学或替换" → 已完成任务不可直接替换（须先重开），但 UI 规则未写 | 在 FR-02 操作表补前置条件：done 任务只能"添加"或先"重开"再替换 |
| C-16 | §18 / §20 | `Curriculum` 的节点结构（FR-07 的 nodeId、前置节点、目标、实践题、检查问题、资料）在第 18 节"关键实体"中没有实体定义，只有 `WorkItem.nodeId` 引用 | 补 `RouteNode` 实体（nodeId、prerequisites、goal、exercise、checkQuestion、materials、version、status） |
| C-17 | §14 / §18 | `LearningPrompt` 只有 `text` 字段，但 §14 要求 Prompt"包含角色风格、今日目标、已知进度、任务步骤、完成标准、资料链接、卡点、互动方式"共 8 类内容 → 无法校验、无法按需刷新单段 | 要么把 Prompt 拆成结构化字段 + 渲染，要么明确 text 为唯一产物、上述 8 项只是模板章节（并放弃"刷新单段"的期望） |
| C-18 | §19 | `expectedRevision` 与 §15 的 `operationId` 两套并发保护没有优先级规则：新 operationId + 过期 revision 时是拒绝、重放还是合并？ | 定义顺序：先校验 operationId 幂等（已处理则直接返回原结果），再校验 revision（过期则拒绝并要求刷新） |
| C-19 | §7 / §20 | 模型可调用工具"读取今日计划"在**当天尚无计划**时的行为未定义：若它内部调用 `ensureTodayPlan`，就形成"模型工具触发规划模型"的嵌套调用（成本、超时、并发都与 `plannerConcurrency: 1` 相关） | 明确读工具**不得**触发生成：无计划时返回"今日未准备"，由用户显式操作准备 |
| C-20 | §16 / §19 | `backups/` 无保留策略；`state.json` 每次操作重写但备份频率、数量、清理规则未定义 | 定义备份触发点（每日首次写入 / schema 升级前）与保留上限（如最近 N 份或 30 天） |
| C-21 | §16 / §22 AC-14 | 跨日实例的日期文件更新范围未定义：完成今日续学项时，是否同时重写来源日期的 plan.json/plan.md（其 task 的 carriedToTaskId 变化）？ | 明确：写今日文件为必须；来源日期只更新 task 引用字段，或改为"来源日文件不回溯更新"，二选一并写进 AC-14 |
| C-22 | §7 / §5 | 时区变更后，若"当前时刻在新时区下的 localDate"已有旧时区创建的 DayPlan，唯一键（learningSpaceId + localDate）如何处理未定义 | 定义：以 `timezoneAtCreation` 判定归属，冲突时新建 DayPlan 并保留旧的、或直接提示用户选择 |
| C-23 | §21 | 版本/依赖声明粒度不足以维持可用性：生态实测表明 **caret 范围跨 minor 会被宿主启动兼容性预检判定失败并"整行静默禁用"**（不报错、不提示）。spec 只写"发布须声明已验证 DSH 版本/commit、Node 版本、profile、扩展位置及依赖"，没有 pin 策略，也没有"如何确认没被静默禁用"的验收步骤 | 写死：peer/devDep 用精确版本或同 minor 范围；给出"DSH 版本 → 插件版本"对照表；AC-01 增加 `dsh --profile <p> --dump-config` 确认该行已启用 |
| C-24 | §20 / §21 vs §5 | **配置的落盘位置与"写入范围限于 dataRoot"冲突**：DSH 0.1.7 起插件配置持久化在 profile 里本插件的**挂载行**（`cordis.patch.yml` 的 `insert[].config`），由宿主 ConfigEditor 写入；spec §20 却说"角色正文和学习进度……**不必依赖编辑 cordis.yml**"，§21 又说"写入范围限于 dataRoot"。首次配置表单要保存 `dataRoot`（绝对路径）这件事本身就必然写到 dataRoot 之外 | 明确三段：①**挂载行**（宿主配置，Schemastery 校验）= 环境字段；②**dataRoot** = 业务数据（插件自己原子写）；③禁止的只是"插件代码去改宿主源码/其他插件行"。并在 spec 里写清"首次配置由宿主配置编辑通道完成，不由插件直接写 profile 文件" |
| C-25 | §5 FR-01 vs OFF-03 / §21 | **"校验 dataRoot 绝对路径及可写性"若做进 Config schema，会把用户挡在 DSH 之外**：宿主在插件加载时执行 Config schema 校验，"Invalid configuration fails the load"，而插件加载失败会波及整个 profile 组合（`dsh-app-boot` 收集为 `skippedBundles`；社区文档更直白："one plugin that cannot load stops the whole process"）。用户首次安装时 dataRoot 还不存在/还没选，必然校验失败 | **Config 只声明"可为空"的字段**（`dataRoot: Schema.string()`，无强制存在性校验）；"绝对路径 + 可写 + 非同步盘"检查放在**运行时**（准备计划/保存前），失败只让本插件进入 `error/preparing` 状态并给出引导，绝不能让加载失败。补一条 AC："未配置 dataRoot 时插件仍能成功加载并显示配置表单" |

### 1.3 可验证性与可维护性

- **FR → AC 覆盖缺口**：FR-01（初次配置）无 AC；FR-07（LLM 路线/知识状态）无直接 AC；FR-08（Agent 工程任务）无直接 AC。建议补 AC-20/21/22。
- **无 FR 编号的章节**：§18 数据结构、§20 业务模块与模型配置、§21 权限/生命周期/发布 全部没有 FR 编号，导致"是否实现"无法逐条验收（尤其 §18 的 `schemaVersion`/`revision`/时区不重写 等硬约束、§21 的路径穿越防护与卸载行为）。
- **测试不可判定项**：AC-09（见 C-01）、AC-03（见 C-11）、AC-16（见 C-04）在现状下都无法写出确定性断言。
- **"冲突裁决顺序"自指**：§2 规定"用户最新修订意见 → 本稿功能约定 → 旧版建议"，但本稿即"用户本轮审查意见"的产物，实际只有两级；建议改为"用户在本稿上的批注 → 本稿 → v0.1"。

---

## 2. 与 DSH 官方插件规范的符合性

### 2.0 核实基准（本机 + 官方文档）

**本机安装（实测）**

| 项 | 值 | 来源 |
|---|---|---|
| DSH 版本 | `@deepseek-ai/dsh` **0.2.0-rc.2**（桌面壳 `dsh-desktop` 0.2.0-rc.2，build commit `04f392c9ddd144fa426da2045178797da6db6c11`） | asar 内 `package.json` |
| Cordis / Schemastery | `@deepseek-ai/cordis` **4.0.4** / `@deepseek-ai/schemastery` **3.18.4** | asar 内 `dsh/package.json` |
| Node / pnpm | 24.21.0 / 11.7.0 | `D:\Software\DSH\resources\runtime\primary-runtime\runtime.json` |
| 现有 profile | `~/.dsh/profiles/web`、`~/.dsh/profiles/desktop`（含已装第三方插件 `dsh-synapse`、`dsh-cost-meter`、`dshmarket`） | 实测目录 |

**官方文档**：`github.com/deepseek-ai/deepseek-harness`（`master`）下的 `docs/`，下列结论全部来自 raw markdown（HTTP 200，无 404）。注意：spec §24 的仓库 slug 写的是 `deepseek-ai/deepseek-harness`，大小写与真实仓库一致，可用；但 `docs/user/develop/basic/*` 之外，**真正决定本插件形态的文档在 `docs/subsystems/`**（slots / client-modules / sidebar-right / web-client / llm-streaming / web / storage），spec §24 完全没有引用，这是参考资料清单的缺口。

### 2.1 OFF-01 … OFF-09 逐条核对

| 条款 | 结论 | 官方依据（原文/位置） | 对 spec 的影响 |
|---|---|---|---|
| OFF-01 TypeScript + Host 入口 ESM | **成立** | "a plugin is a TypeScript module that exports an `apply` function"；bundle 清单要求 `"type": "module"`、`export const name` / `export function apply`（[basic/index.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/basic/index.md)、[publish.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/basic/publish.md)） | 无需改 |
| OFF-02 `name` / `apply(ctx, config)` / `inject` | **成立** | 同上；"The framework waits for every required service before loading the plugin." | 无需改 |
| OFF-03 `Config` 类型 + 同名 Schemastery schema，校验并给默认值 | **成立** | "Export a `Config` type and a same-named Schemastery schema. Put defaults directly on the schema fields"；"Cordis uses the exported schema to validate configuration and fill defaults"；"Do not export a plain object as `Config`"（[basic/config.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/basic/config.md)） | 无需改；但见 C-03（配置 vs state.json 权威源）必须在 v0.3 定死 |
| OFF-04 用官方 `defineTool` 注册到 `ctx.tools` | **成立，但表述过略** | `import { defineTool } from '@deepseek-ai/dsh-tools'` → `ctx.tools.register(defineTool({ name, description, parameters, output, execute }))`；`inject = ['tools']`；"Registration is effect-based: disposing the plugin fiber unregisters the tool"；read-only **不是**声明字段，靠 presentation intent / `tools/pre-execute` 策略钩子表达（[basic/tool.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/basic/tool.md)、[cookbook/adding-a-tool.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/cookbook/adding-a-tool.md)） | 建议把包名、`inject: ['tools']`、effect 语义、以及"工具必须尊重 `exec.signal`、throw 表示 isError"写进 §20 |
| OFF-05 Cordis 可撤销生命周期 | **成立** | "Anything registered through `ctx`—event listeners, tools, or timers—is cleaned up when the plugin unloads."；API 名为 `ctx.on` / `ctx.effect` / `ctx.interval` / `ctx.timeout` / `ctx.throttle` / `ctx.debounce`（[framework/index.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/framework/index.md)、[cordis-primer.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/cordis-primer.md)） | spec 没有再编造 `ctx.setInterval`/`ctx.dispose`/`ctx.scope`（官方无此名），**保持现状即可**；v0.3 可把这些真实 API 名列进 §21 |
| OFF-06 `--patch` overlay 开发 + 声明 `dsh.bundle.patch` 的 bundle 分发 | **成立（字段是嵌套的）** | dev：`pnpm dsh web --patch ./scratch-plugin/cordis.yml`，overlay 是 `- insert: [{ id, name, config }]`，且"The plugin path must be absolute"；bundle：`"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`，`patch` 也接受有序文件列表；"A **bundle** is an npm package that ships a configuration layer… A **profile** is a directory… Nothing is both."（[publish.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/user/develop/basic/publish.md)） | 把 `dsh.bundle.patch` 写成完整 JSON 路径示例，避免有人误写成扁平键 |
| OFF-07 `dsh plugin` 安装到目标 profile，不改宿主 loop、不替换用户 profile | **成立** | `dsh plugin --profile demo add ./hello-plugin`（"forwards to pnpm in the profile directory"）；未声明 `dsh.bundle` 的包"still installs, but only as a plain dependency… prints a warning and activates no layer"；"No row modifies the loop."；"There is no privileged core to patch" | 补"安装后如何验证真的启用"（`dsh --profile <p> --dump-config`），正好补上 AC-01 的可操作验证步骤 |
| OFF-08 Client 按 `dsh.client` / `./client` / client factory 规则加载 | **成立，但 spec 低估了成本** | 需 `exports["./client"]` + `"dsh": {"client": {"platform":"web"}}`；产物必须是 **lazy-CJS factory**（"one script that registers the package name and a `factory(require)`"）；"The `clientBundle` tsdown preset … lives in `packages/client/tsdown.client.ts` **rather than in a published package, so a package outside this repository reproduces that build itself.**"；`dsh.client.inject` "informational only"；bundle 必须**预先构建**（`dsh plugin add` 不构建；git 安装只取源码）（[client-modules.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/subsystems/client-modules.md)、[adding-a-settings-card.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/cookbook/adding-a-settings-card.md)） | 新增工作量：**仓库外作者要自己复刻客户端构建 preset**，且发布包必须带上已构建的 `lib/client.js`。spec §21 只写了"发行包包含 Host/Client 构建产物"，方向对，但要把"自行实现 lazy-CJS 打包"列为独立任务与风险 |
| OFF-09 规划复用宿主已配置模型与权限、不另存 API Key | **方向对，原文依据不足** | 官方确实有 `ctx.llm`（`stream` / `prepareCall` / `resolveCallConfig` / `listProviders` / `listModels` / `registerAdapter`），"route" 就是 `LlmCallConfig { provider, model, reasoningEffort?, temperature?, maxTokens?, stop? }`；凭据由 credentials seam 以 `CredentialRef` 引用管理，"**Never read ad-hoc key files in code**"（[llm-streaming.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/subsystems/llm-streaming.md)、[adding-an-llm-adapter.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/cookbook/adding-an-llm-adapter.md)）。但**没有**"复用宿主已配置模型"或"不得另存 API Key"的原句；且 LLM provider 类插件本来就允许在自己的 Config 里声明 `apiKey` | 把 OFF-09 改写成可核实的表述："规划调用走 `ctx.llm`，`planningModelRoute` 的类型是 `LlmCallConfig`，凭据交给宿主 credentials seam，插件不读写密钥文件" |

**小结**：OFF-01 ~ OFF-08 与官方机制不冲突（OFF-06 是字段写法问题，OFF-08 是工作量估计问题）；**OFF-09 需要改写**（不是错，而是把"推测"写成了"规范"）。

### 2.2 spec 对宿主能力的三个误判（都是可以改好的方向）

**（1）§4「无合格面板扩展点时报告兼容性缺口，不以一次性聊天卡片代替固定入口」——前提已经不成立：合格扩展点存在，而且是两个。**

- 左栏**全局面板**：`sidebar.panellist`（**list**，由 `dsh-client-ui-sidebar` 声明）放栏位按钮 + `main`（**keyed**，由 `dsh-client-ui-layout` 声明）放页面，两者用同一个 id；`selectPanel` 调 `ctx.layout.selectPanel(id)`。本机实证的"配方"：官方自带插件 `dsh-client-ui-plugin-manager`（`id: PANEL_ID, order: 0, label`）与 `dsh-client-ui-schedule` 就是这么做的。代价：**本机没有第三方插件用过这条路**（第三方实证的是 `sidebar.footer.action`、`settings.section`、`shell.overlay`），属于"宿主自用已证明、第三方未证明"。
- 右栏**停靠标签**：`ctx.sidebarRightTabs.register({ id, kind, patterns?, priority, canOpen?, title, keepMounted?, guide? })` + keyed slot `sidebar.right.pane.tab`，`priority` 的 `extension` 档"the default and the highest: a type from outside the product outranks every shipped viewer"（[sidebar-right.md](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/subsystems/sidebar-right.md)）。代价：**"All tabs require a foreground Session"**，且"layout state is memory-only; a reload starts every session collapsed"。
- 通用约束：注册只能走 `ctx.slots.inject(key, () => ctx.slots.register({...}, Component))`；**插件不能自己声明新 slot**（`register()` 会抛 `slot "…" is not declared`），也不能占用 `plugins.item`（"OCCUPIED by the official settings pages"）。本机共声明了 83 个可用 slot。

→ §4 应从"可能没有扩展点"改为"在两个官方扩展点里选一个"。**建议：主入口用左栏 `sidebar.panellist` + `main`（root 作用域、与会话无关，最贴合"打开 DSH 就看今日计划"），任务详情/历史做同一个面板内的视图**；右栏留给"从某条任务跳到会话上下文"这类可选增强。AC-01 应改成可验收的具体注册目标（含 slot 名与 id）。
另外两个入口要按本机实情修正：**§6 的"设置"入口不能用 `settings.plugin.item`（该 slot 与 `settingsScope` 在 0.2.0-rc.2 已不存在，注册会静默不生效）**，应改用第三方已验证的 `settings.section`；"历史/路线/角色"若要独立入口，同样只能作为主面板内部视图，不能新开 slot。

**（2）§20「不假设 DSH 自带可用搜索」——宿主有 `ctx.web`，但"有服务"和"有可用 provider"是两件事。**

官方 `docs/subsystems/web.md`："The web access seam — a capability seam that spans **two operations** (search and fetch) on one `ctx.web` service"，方法为 `search(request, signal)` / `fetch(request, signal)`，并给出强类型错误集 `WEB_PROVIDER_UNAVAILABLE | CONFIGURED_MISSING | CONFIGURED_UNAVAILABLE | AMBIGUOUS | DUPLICATE_PROVIDER | ABORTED | PROVIDER_ERROR`。→ FR-09 的"来源能力状态"应改为映射这组错误码（未配置 → 引导去设置页；provider 不可用 → degraded + 缓存），而不是笼统的"不存在可用搜索服务"。这也让 AC-17 变得可写。

**（3）§5「planningModelRoute：宿主已配置的 DeepSeek 规划路由，不写死模型版本」——可以更精确。**

`ctx.llm.listProviders()` / `listModels()` / `resolveCallConfig()` 让配置表单能直接列出用户已配置的 provider/model 供选择，产出一个 `LlmCallConfig`；这比"用户自己填一个 route"更不容易配错，也天然满足"不写死模型版本"。同时删掉"DeepSeek"这个限定（宿主的 LLM 适配器是插件化的，不保证只有 DeepSeek）。

### 2.3 spec 缺少、但 v0.3 必须补的规范级字段

1. **插件清单字段**：`name`、`Config`（Schemastery）、`inject`、可选 `provide`；`"type": "module"`、`main`、`exports`（含 `"./client"`）、`dsh.bundle.patch`、`dsh.client`。
2. **客户端注册语法**：`inject = ['slots', …]` + `ctx.slots.inject/register`；组件不得接收 `ctx`，"Components never receive `ctx`"（数据经 `inject` 工厂、store、owner props 传入）——这直接约束 §6/§19 里"Client 携带 expectedRevision 提交修改"的实现方式。
3. **数据落盘方式**：宿主有 `ctx.fs`（由 `dsh-fs-sandbox` 提供，是**受限** provider，带 `sandboxMode`、按 `FsTargetKey` 解析，并非任意绝对路径写入器）、`ctx.storage`/`ctx.storageDomain`（宿主 KV，"The event is in-process only; cross-process change push is a recorded limitation"），以及 `@deepseek-ai/dsh-atomic-write`（**是工具库不是服务**：`writeFileAtomic` / `withFileLock`）。生态实证：`dshmarket` 与 `dsh-cost-meter` **都不用 `ctx.fs`**，而是直接 `import fs from 'node:fs'` + `@deepseek-ai/dsh-home-paths`。→ spec 必须明确选一条：①用 `node:fs` 直接写用户选择的 dataRoot（`dshmarket` 的做法，自由但要自己保证原子性 —— 可复用 `dsh-atomic-write`）；②用 `ctx.fs`（受沙箱约束，dataRoot 在受信范围之外时可能写不进去，需要 spike 确认）。**这一条直接决定 §5 的"dataRoot 可写性"该怎么校验。**
4. **`--patch` 开发与 profile 的关系**："A patch file contributes configuration but does not change the profile directory"——开发期不要把 dataRoot 放在插件包内；profile 的 `cordis.yml` 是空数组（"Edit cordis.patch.yml, not this file"），配置一律写在 `cordis.patch.yml` 的 `insert[].config` 里，且支持 `!!js dshHomePath('...')`。
5. **依赖来源**：npm 上 `@deepseek-ai/dsh-tools`、`dsh-client-ui-slots`、`dsh-typert-generator`、`dsh-client-connection` 的 `latest` 仍是 `0.0.1-rc.1`，**`next` 才是 `0.2.0-rc.2`**；部分包清单里写着 `publishConfig.access = restricted`。生态插件实测可"走 npm `next` 通道直接解析、无需令牌"（见 2.4 R4）。

### 2.4 必须在写 plan 之前 spike 掉的四个技术风险

| ID | 风险 | 为什么是风险 | spike 验收 |
|---|---|---|---|
| **R1** | **Host↔Client 通道**（已消解：两条路都有第三方实证） | spec §19 要求"Client 修改携带 expectedRevision"。官方文档只描述了 Typert Remote（`@Remote` + 构建期生成器 + `api-remotes` 有限装配），对仓库外插件未作保证。**本机实证**：① `dsh-cost-meter` 走的正是自带 Remote —— 包内 `exports["./typert"]`，宿主 `ctx.inject(['typert'], c => c.typert.register(TYPERT))`，客户端 `inject=["remote"]` + `ctx.remote.$mount(def)` + `ctx.get('remote.costMeter')`；② `dshmarket`、`dsh-synapse` 走自建 HTTP 路由 —— `ctx.webServer.register({ kind:'exact'|'prefix', path, handler })` + 浏览器 `fetch('/synapse/api/...')` | **两条都可行**。第一版建议走 ②（少一步代码生成、协议自己完全掌控）；若后续需要"客户端直接读写插件配置"，再考虑 ①（cost-meter 正是用它读写状态与配置） |
| **R2** | **客户端产物构建** | 发布版不含 `clientBundle` tsdown preset（"a package outside this repository reproduces that build itself"），产物格式是 `window.__ModuleLoader__.load({ id, factory })` 的 lazy-CJS 单文件；且 React/Cordis/`ui-primitives`/`ui-slots` 等**基线模块不得写进包清单**（"Do not repeat React, Cordis, `client/store`, `ui-primitives`, `ui-slots`, or `ui-dockkit` in package manifests"） | 手工产出一个最小 `client.js`，在 Web GUI 里看到它注册的 slot 生效并支持 HMR 重载。**已有可抄的参考实现**：`dsh-file-tree`、`dsh-better-sidebar` 的单包 host/client 双半结构 |
| **R3** | **固定面板语义** | 左栏全局面板 vs 右栏 Session 标签，代价不同（见 2.2(1)）；spec 的"可收起""跨天不强制切换用户当前页面""多标签页一致"都受此影响 | 二选一定稿，并把"收起状态保存"落到具体 API（右栏的收起是记忆态布局，刷新即丢，见 2.5） |
| **R4** | **依赖可得性**（已基本消解） | `@deepseek-ai/dsh-tools`、`dsh-client-ui-slots` 等包在 npm 上 `latest` 是 `0.0.1-rc.1`、`next` 才是 `0.2.0-rc.2`，个别清单写着 `publishConfig.access = restricted` | 生态插件实测："`@deepseek-ai/*` devDependencies 已发布（基线 0.2.0-rc.1，走 npm `next` 通道），**直接解析、无需令牌**"（`dsh-better-sidebar` 开发文档）。仍需在本机跑一次 `pnpm add @deepseek-ai/dsh-tools@next` 确认，但风险已从"可能不可得"降为"配置问题" |

> 说明：R1/R2 是**可行性**风险（决定架构），R3 是**产品形态**风险（决定交互），R4 是**工程流程**风险（决定仓库怎么放）。R1/R4 已由生态实测大幅降级，但**R2/R3 仍需要 spike**。

### 2.5 生态实测经验（第三方来源，仅作佐证；每条都与官方文档不冲突）

结论先行：**"每日计划面板"这类固定入口在 DSH 生态里已经是成熟做法**——`dsh-better-sidebar` 一个插件就有 28+ 个第三方插件通过它注册侧边栏页面。以下实测经验建议直接写进 spec 的风险与验收部分。

| 事实 | 来源 | 对 spec 的影响 |
|---|---|---|
| **右栏标签是第三方插件的主流选择**：`ctx.sidebarRightTabs.register({ id, kind, title, guide })` + `ctx.slots.register` 挂 `sidebar.right.pane.tab`（keyed，key 必须等于类型 id）+ `ctx.get('sidebarRight').openResource(...)` | `dsh-file-tree` 的选型笔记 `docs/why-native-tabs.md`（明确写"官方正路"，并记录为 0.1.6-alpha.2 实测） | 支持 2.2(1) 的判断；**若采用右栏，spec 的"可收起/固定入口"要按右栏语义重写** |
| **宿主半用 prefix 路由而不是 Remote**：宿主侧 `ctx.webServer.register({ kind: 'prefix' })`，浏览器侧 `fetch` 这些路由；`ctx.sessions.get(id).header.cwd` 取会话工作目录 | 同上 | **R1 的答案**：先按 prefix 路由设计 Host↔Client，别赌 Remote |
| **路由必须自兜异常**：宿主 `ctx.webServer` 会把路由里逃逸的异常吞成 **400 空响应**，所以路由要自己 catch 并返回 JSON 信封 | 同上 | 直接写进 §19 的失败行为（否则"停止写入/报错提示"会变成静默 400） |
| **服务可能晚于插件出现**：`sidebarRightTabs` 等要 `ctx.inject([...], cb)` 等它；宿主侧服务必须写进插件自己的 `inject`，否则运行时抛 `cannot get property "x" without inject`；可选服务用 `ctx.get()` 探测 | 同上 | 补进 §21 生命周期要求 |
| **右栏是会话级**：未选中会话时操作会弹"选择会话"提示；布局状态仅存内存 | `dsh-better-sidebar` README（"未选中会话时，点按弱化开关会显示选择会话提示"）+ 官方 sidebar-right 文档 | 与"打开 DSH → 查看今日计划"的体验目标存在张力，**必须在 spike 里实测"冷启动无会话时面板是否可见/可用"** |
| **固定的全局面板是宿主自用路线**：`sidebar.panellist`（list）+ `main`（keyed，同 id）由官方自己的 `dsh-client-ui-plugin-manager`、`dsh-client-ui-schedule` 使用；本机第三方插件用的是 `sidebar.footer.action` / `settings.section` / `shell.overlay` | 本机 asar 静态分析（见 2.6） | 这条路"合法且被宿主自己验证"，但**第三方先例为零** → 仍要在 spike 里跑通，别只依据文档 |
| **`settings.plugin.item` / `settingsScope` 在 0.2.0-rc.2 已不存在**：dshmarket 注册进这两个位置的代码**永远不会触发**（静默失效） | 同上 | §6"设置提供独立入口"必须改用 `settings.section`；并提醒：**slot 名写错的表现是静默不生效，不是报错**，验收必须真的在界面上看到 |
| **插件加载失败会波及整个组合**：`dsh-app-boot` 把失败收集为 `skippedBundles`，社区文档更直白："one plugin that cannot load stops the whole process" | 同上 | 强化 C-25：任何校验都不得让加载失败 |
| **宿主半就是普通 Node 代码**：`dshmarket` 直接 `node:fs` 写 profile 的 `package.json` / `cordis.patch.yml`，并用 `resolveDshHome()`；`ctx.fs` 是受限 provider，`@deepseek-ai/dsh-atomic-write` 是工具库 | 同上 | C-24 的"配置走挂载行"在实现上由宿主 ConfigEditor 负责；插件自己的 dataRoot 写入要显式选 `node:fs` 还是 `ctx.fs`（见 2.3-3） |
| **插件配置写在 profile 的挂载行上**：DSH 0.1.7 起删除了"插件可注册的设置命名空间"，偏好写在 profile 里本插件的挂载行 `config:`（默认 entry id 即插件名），设置页编辑的就是这一行；旧 `settings.yaml` 的名字段需自行回迁 | `dsh-better-sidebar` README 的 FAQ | **直接印证 C-03 的裁决方向**：宿主配置=挂载行（Schemastery 校验），用户业务数据=dataRoot。spec §5 应照此分层，不要把角色/进度塞进配置行 |
| **版本范围写错会被静默禁用**：caret 范围跨 minor（如 `^0.1.7-rc.1` 装在 0.2.0 宿主上）会被**宿主启动兼容性预检**判定失败并整行禁用，不报错 | `dsh-better-sidebar` README（列出按 DSH 版本选插件版本的对照表，并引用 `semver.satisfies` 实测） | spec §21"声明已验证 DSH 版本/依赖"要升级为**精确 pin + 给出对照表**；AC-01 的"通过官方方式启用"必须附带"用 `dsh --profile <p> --dump-config` 确认该行未被静默禁用" |
| **安装后需要硬刷新**：client 半改动热加载，host 半改动需要重启 DSH | `dsh-file-tree`、`dsh-better-sidebar` 均如此说明 | AC-01/AC-02 的验收步骤要写清"硬刷新浏览器"，否则会被误判为未生效 |

> 这些是第三方（社区）文档，不是官方规范；引用它们是因为每条都能与官方文档互相印证，且能提供官方文档没有的**踩坑清单**。使用前仍以本机 0.2.0-rc.2 实测为准。

### 2.6 本机 0.2.0-rc.2 静态实证（直接解析 `app.asar`，非社区文档）

核对方式：用安装自带的 Node 解析 `app.asar` 头部并按偏移读取成员，对 289 个 `@deepseek-ai/*` 包做机械化检索（`super(ctx, "<name>")` 服务名、slot 声明表、`dsh.client` 解析器、插件导出的实际形状）。结论如下，**凡与 spec 相关者已在正文引用**：

| 事实 | 证据 | 对 spec 的意义 |
|---|---|---|
| **插件形状**：`export const name` + 可选 `export const inject` + `export function apply(ctx, config)`，纯 ESM；`dsh.bundle.patch` 接受字符串或数组；缺 `dsh.bundle` 的包被硬拒（`profile bundle <pkg> declares no dsh.bundle in its package.json`）；`dsh.client` 由 `parseDshClient` 校验，成员不合法即抛错 | `dsh-cost-meter/lib/index.js:45,3237`；`dshmarket/lib/index.js:12,136`；`dsh-synapse/index.js:5,6,751`；`dsh-app-boot`、`dsh-client-modules/lib/index.js` | OFF-01/02/06/08 全部落实；§21 的发行包字段可以照抄 |
| **Config 校验有两套并存**：`@deepseek-ai/schemastery`（`static Config = z.object({...})`，官方 `dsh-web` 就是）与插件自带的 Zod 4（cost-meter） | `dsh-web/lib/index.js` | OFF-03 继续用 Schemastery 即可；§20 的"字段默认值"写在 schema 上 |
| **100 个可注入服务名**，与本文相关的有：`tools`、`llm`、`web`、`webServer`、`fs`、`storage`、`sessions`、`slots`、`remote`、`typert`、`timer`、`hmr`、`commands`、`systemPrompt`、`logger`、`dshHomePath` | 全量 `super(ctx, "…")` 扫描 | §20 的模块名都是项目自定义的（正确），但**注入的服务名必须用这一组**；`ctx.llm`/`ctx.web`/`ctx.webServer`/`ctx.fs` 均存在 |
| **不存在 `ctx.setInterval` / `ctx.dispose` / `ctx.scope`**（全部核心包零命中） | 同上 | §21 生命周期描述要写成 `ctx.effect` / `ctx.on` / `ctx.inject` / `ctx.provide` / `ctx.get`（+ 自己 `setInterval`/`clearInterval`） |
| **`ctx.web` 在本机是热的**：`dsh-base/cordis.patch.yml` 里 `web` 配了 `searchProvider: deepseek-official`、`fetchProvider: http`，并挂了 `web-search-deepseek`、`web-fetch-http`、`tool-web` | `dsh-base/cordis.patch.yml`（约 471–489 行） | §20 的"不假设自带可用搜索"应改为"**默认存在** `ctx.web`，但要按 `WebError` 错误码处理未配置/不可用"；FR-09 可以更乐观 |
| **83 个已声明 slot**（含 `sidebar.panellist`[list]、`main`[keyed]、`sidebar.right.pane.tab`[keyed]、`sidebar.footer.action`[list]、`settings.section`[list]、`shell.overlay`[list]）；插件**不能声明新 slot** | `dsh-client-ui-slots/lib/index.js`（`SlotCore`，未声明即抛 `slot "…" is not declared`）+ 全量声明表扫描 | AC-01 必须写清注册到哪个已声明 slot；§6 的"独立入口"只能做面板内视图 |
| **Remote 与 HTTP 路由两条通道都被第三方插件实装** | cost-meter（`exports["./typert"]` + `ctx.typert.register` + 客户端 `remote.$mount`）；dshmarket / synapse（`ctx.webServer.register` + `fetch`） | R1 的最终裁决依据 |
| **`dsh-synapse` 用裸 DOM 注入 + iframe**（`document.body.append(...)`、`document.head.append(style)`） | `dsh-synapse/client.js` | 正好是 §21 明确禁止的做法（"不能以 DOM 注入……代替官方插件扩展方式"）——spec 这条写得对，且有反例可引用 |

---

## 3. 建议的最小修订清单（产出 v0.3）

### 3.1 必改（阻塞 plan）

1. **C-01**：AC-09 限定为 LLM/Agent；FR-04 写明算法/AI 例外。
2. **C-03**：定义配置块 vs `state.json` 的权威分层与恢复顺序。
3. **C-04**：DayPlan 拆 `dayCompletion`（冻结）与 `finalCompletion`（后补），并写死统计口径。
4. **C-05**：`planningModelRoute` 允许为空，补无模型可用路径的 AC。
5. **C-07**：跨天只检测+提示，生成由用户动作触发（或明确允许定时生成并补节流/失败规则）。
6. **C-10**：补 `resumeTask`，明确"取消完成 = reopenTask"。
7. **C-11 / C-12**：AC 与"每类基础任务"的例外；每类每日带入上限。
8. **C-13**：一次定名（包名/bundle 名/profile 配置键/dataRoot 子目录/文档标题）。
9. **§4 重写**：把"可能没有面板扩展点"改为选定的官方扩展点（`sidebar.panellist` + `main`，或 `ctx.sidebarRightTabs` + `sidebar.right.pane.tab`），并把 **R2/R3 与 C-25（加载安全）**写成 plan 的 Phase 0 spike（R1/R4 已实证，不必再验证）。
10. **OFF-09 措辞修正**；**OFF-06** 补嵌套字段示例；**OFF-08** 补"自行复刻 lazy-CJS 构建"。
11. **C-24**：把"配置走挂载行 / 业务数据走 dataRoot / 禁止改宿主源码"三段写清，消除"写入范围限于 dataRoot"与配置持久化的冲突。
12. **C-25**：Config 里不得做会失败的强校验（尤其 dataRoot 存在性/可写性），改为运行时可恢复的 `error/preparing` 状态；补 AC"未配置 dataRoot 也能成功加载并显示配置表单"。

### 3.2 应改（影响可实现性/可验收性）

13. C-02、C-06、C-08、C-09（补 `ProblemRef`）、C-14 ~ C-22。
14. **C-23**：pin 版本范围 + 版本对照表 + `--dump-config` 验收步骤；并把 2.5 的踩坑清单（路由自兜异常、服务晚到用 `ctx.inject`、`inject` 必写、右栏会话依赖、slot 名写错会静默失效、安装后硬刷新）写进 §19/§21/§22。
15. 补 FR-01 / FR-07 / FR-08 的验收标准（AC-20 ~ AC-22）。
16. 给 §18、§20、§21 加需求编号，使每条硬约束可验收。
17. §24 参考资料补齐真正决定实现的文档：`docs/subsystems/{slots,client-modules,sidebar-right,web-client,web-server,llm-streaming,web,storage}.md`、`docs/api-gateway.md`、`docs/cookbook/adding-a-tool.md`，并注明核对到的版本/commit。
18. §20 的"默认可配置项"里补三项本机实证得到的必需项：`dsh.bundle.patch` 指向的 patch 文件名、`dsh.client.platform`、`dsh.compatibility`/`engines.dsh`（生态插件用它做版本闸门）。

### 3.3 建议保留（无需改）

- "外部学习、人工勾选、不读聊天记录、不做 notebook" 这条主线与官方能力没有冲突，也避免了不可实现的集成。
- §19 的"单一 Host 写入者 + expectedRevision + 原子替换 + 备份"方向正确，与"Host 拥有权威状态、Client 只持有投影"的官方架构一致；官方自己的配置页也是这个模式（"Custom plugin pages receive `form.state` and `form.mutate(operations, expectedRevision)`"）。
- §16 的目录约定（`store/state.json` 权威、日期目录为可重建快照）与官方"Host owns authoritative state"的分层一致。

---

## 4. 需要你决策的问题（v0.3 之前）

| # | 问题 | 选项 | 我的建议 |
|---|---|---|---|
| D1 | 固定入口用哪个面板？ | ① 左栏全局面板（`sidebar.panellist` + `main`）：与会话无关、最贴合"打开就看计划"，宿主自用已验证，但无第三方先例；② 右栏标签（`ctx.sidebarRightTabs`）：官方为扩展设计、生态主流，但**必须有前台会话**、布局状态仅存内存；③ 主入口用 ①，右栏做可选增强 | ③。若 spike 中 ① 出现"未声明/不渲染"等问题，退回 ② 并把"需要先打开一个会话"写进 UX |
| D2 | 历史"未完成日"怎么定义？ | ① 当日快照（冻结，永不补成打卡）；② 最终完成（后续补完也算完成）；③ 两者都存、统计时选 | ③（拆字段），并把统计口径写死 |
| D3 | 跨天生成由谁触发？ | ① 只在用户前台动作时生成；② 午夜定时自动生成 | ①（与 §3 排除项、§20 成本口径一致） |
| D4 | 未完成项每日带入上限？ | ① 无限顺延；② 每类 1 项续学 + 其余折叠计数 | ② |
| D5 | 插件范围要不要砍？ | 当前 §3 的"必须包含"含 4 类任务 + 4 套角色 + 历史 + 路线 + 算法选题 + AI 检索 + 面板，是一个完整产品 | 建议把第一版砍到"面板 + 四类基础任务 + 勾选 + dataRoot 落盘 + 续学"，把 AI 检索、角色编辑器、历史页放到第二版 |
| D6 | 插件正式名称？ | `dsh-daily-learning` / 其他 | 定一个名字并同步 worktree 目录名（当前是 `DailyPlan_Sticker`） |
