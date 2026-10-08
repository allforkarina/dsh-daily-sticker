# DSH Daily Learning — 实施计划

> 2026-10-09 范围收缩：用户明确要求每日任务规划与备忘录式展示，不需要进度回填或步骤勾选。此计划保留为原范围的历史参考。精简范围见 `docs/daily-planner-spec-v0.4.md`；确认后将重新裁剪实施步骤，不继续按下文的完整学习管理模块开发。

版本：0.1-draft  
日期：2026-10-08  
依据：dsh-daily-learning-spec.md v0.3-draft  
正式包名：dsh-daily-learning  
状态：计划文档已编写；尚未执行本计划中的 spike、实现或目标机器验收。

## 1. 目标与执行边界

交付一个可安装的 DSH 插件：用户打开无会话的全局学习工作台，看到算法、LLM、Agent 工程、AI 探索四类任务；可复制独立角色的学习 Prompt，在 GPT 等工具中学习，回来勾选、记录、追加。业务状态保存到用户指定的本地目录，日期计划持续累计，未完成目标可以续学。

本计划落实 spec，不重新缩减第一版范围。AI 检索、四类文本风格编辑、追加任务、跨日续学和简单历史均属于交付内容。中间里程碑可以使用模板，但模板阶段通过不等于第一版完成。

第一版不做会话跳转、GPT 调用、聊天导入、notebook 整理、算法提交、项目扫描/执行、右栏、统计仪表盘或自动总结。角色是可复制的指令预设，不创建四个运行中的 Agent。

本次只编写 plan。实施阶段遵循本计划推进；只有变更产品裁决或无法满足宿主集成条件时才记录问题并请求裁决，不重复询问已确定的 D1–D6。

## 2. 已确定的实现决策

| 项目 | 第一版选择 | 实施约束 |
| --- | --- | --- |
| 固定入口 | 左栏 sidebar.panellist + 同 id 的 main | 无会话、无 Workspace 可访问；不自动退到右栏 |
| 标识 | dsh-daily-learning | 包名、bundle、插件 name、默认 entry id、panelId 一致；项目目录可保留 DailyPlan_Sticker |
| Host | TypeScript，ESM | 消费服务声明 inject，资源清理跟随 Cordis 生命周期 |
| Client | 预构建 lazy-CJS factory | exports["./client"]，dsh.client.platform=web；共享框架外部化 |
| 通信 | ctx.webServer 命名路由 + 同源 fetch | /daily-learning/api/；显式复用宿主认证及 Host/Origin 检查 |
| 环境配置 | 宿主挂载行 Config | 可空 dataRoot/model；正式 ConfigEditor 更新本插件行 |
| 业务数据 | dataRoot/store/state.json | 单个 Host 写入；日期 JSON/Markdown、角色文件为可重建快照 |
| 规划调用 | 用户进入今日工作台或明确点击 | 已有计划恢复、午夜检测、后台、焦点恢复和纯读不调用模型 |
| 续学 | WorkItem 稳定身份，Task 按日实例 | LLM/Agent 续学占基础位；算法/AI 新基础 + 续学追加 |
| 历史 | dayCompletion + finalCompletion | 日内结果冻结；后来补完单独记录 |
| 模型 | 宿主 ctx.llm 与 LlmCallConfig | 可不配置；不收集或写入 API Key |
| 资料 | 宿主 ctx.web、来源适配器和缓存 | 来源验证独立于模型；失败明确降级 |

目标候选环境来自用户审查报告：DSH Desktop 0.2.0-rc.2，commit 04f392c9ddd144fa426da2045178797da6db6c11，Cordis 4.0.4，Schemastery 3.18.4，Node 24.21.0，pnpm 11.7.0。同版本 Web 单独验证。以上不是本插件已经通过的兼容承诺；各 npm 包的实际版本在 P0 查明后逐个锁定。

官方 master 文档仅用于机制参考。涉及签名、构建协议、ConfigEditor 和认证入口时，实施以目标安装的类型、源码和真实运行结果为准。

## 3. 模块与目录安排

以下是项目内部结构建议，名称不是宿主 API；P0 确认目标包布局后可调整路径。

```text
DailyPlan_Sticker/
  package.json
  pnpm-lock.yaml
  cordis.patch.yml
  tsconfig.json
  scripts/
    build-host.mjs
    build-client.mjs
  src/
    host/
      index.ts                 # name、Config、apply、生命周期
      config.ts
      routes.ts                # 认证、白名单、请求/响应边界
      llm-adapter.ts
      web-adapter.ts
    domain/
      daily-learning-service.ts
      task-transitions.ts
      carry-policy.ts
      completion.ts
      curriculum.ts
      clock.ts
    planning/
      planner.ts
      templates.ts
      schemas.ts
    sources/
      leetcode-source.ts
      ai-content-source.ts
      source-cache.ts
    persistence/
      local-store.ts
      writer-lock.ts
      backup-manager.ts
      date-snapshot-writer.ts
      migrations.ts
    prompts/
      role-profile-service.ts
      learning-prompt-builder.ts
    shared/
      entities.ts
      contracts.ts
      validation.ts
    client/
      index.ts                 # slot 注册；组件不接收 ctx
      api.ts
      store.ts
      workbench.tsx
      task-detail.tsx
      add-task-preview.tsx
      role-editor.tsx
      history.tsx
      onboarding.tsx
  tests/
    domain/
    persistence/
    contracts/
    fixtures/
  docs/
    compatibility.md
    spike-report.md
    acceptance.md
    install.md
    recovery.md
  lib/                         # 构建输出，不手工编辑
```

领域层不直接依赖 ctx、浏览器、网络或真实时间。Host 适配器注入 Clock、LocalStore、模型和来源能力。Client 只通过受限接口读写，不读取文件、不持有凭据。

学习 Prompt 由结构化 sections 确定性渲染；角色变更与任务内容变更分别版本化。来源验证、任务完成确认和路线进度更新不交给模型决定。

工具选择优先复用目标仓库已有约定。若独立项目没有测试/构建工具，建议采用 TypeScript + esbuild + Vitest；这只是项目工具建议，具体精确版本在 P0 锁定，不能由此推导宿主支持某个 Client 输出格式。

## 4. 阶段总览与依赖

| 阶段 | 产出 | 前置 | 完成门槛 |
| --- | --- | --- | --- |
| P0 集成 spike | 可安装最小 Host/Client、目标接口记录 | 无 | 面板、构建、认证、配置、卸载路径实证通过 |
| P1 数据底座 | schema、LocalStore、锁、备份、快照 | P0 | 故障不丢已提交状态；未知版本拒绝写入 |
| P2 业务规则 | 日计划、状态机、追加、续学、完成口径 | P1 | 核心规则在可控时钟下通过 |
| P3 手动闭环 | 模板工作台、配置、HTTP、勾选、日期文件 | P0–P2 | 真实 DSH 完成一次无模型保存/重启恢复 |
| P4 角色与学习路线 | 四类文本角色、Prompt、LLM/工程持续任务 | P2–P3 | 外部学习无需聊天文件也可推进 |
| P5 来源 | 算法选题、AI 原始来源与缓存 | P1–P3 | 难度、时效、避重和降级可验证 |
| P6 模型规划 | 宿主路由、结构化候选、前台触发与取消 | P4–P5 | 调用边界正确；旧状态和人工修改不被覆盖 |
| P7 工作台完善 | 全操作、折叠队列、历史、主题和键盘 | P3–P6 | 四类完整用户流程可操作 |
| P8 综合验收 | AC-01～AC-32 记录、故障和并发验证 | P7 | 无未解决的交付阻断项 |
| P9 打包交付 | 预构建 tgz、安装/恢复文档、兼容表 | P8 | 清洁 profile 实装；Host/Client 均加载 |

执行以这条依赖顺序为主。P4/P5 的纯模块在接口稳定后可独立开发，但共享数据与契约先合并验证；不为本计划引入多 Agent 协作。

里程碑 M0=P0：宿主可以承载插件。M1=P3：模板模式的本地记录闭环。M2=P7：第一版功能齐全。M3=P9：通过验收的安装包。M1 不是将 AI 检索或角色编辑延期的产品裁决。

## 5. P0：先验证宿主集成

目的：把审查报告的静态证据转成“本插件在目标环境实际可用”的证据，避免业务代码写完才发现 Client 不加载。

### P0.1 版本与入口

- 登记实际 DSH 版本/commit、profile、Node、Cordis、Schemastery、各消费包版本和导出。
- 检查目标版本的官方包类型及 loader，不凭 master 或第三方 package.json 推断字段。
- 开发用独立测试 profile/patch，保留现有 Windows 项目路径；不重做报告中的 ACL 操作。
- 锁定依赖；next 仅用于查找已发布版本，发行清单与 lock 不保留漂移标签。

### P0.2 最小双面构建

- 最小 Host 导出 name、Config、apply；dataRoot/model 默认 null。
- 建立 ESM Host 构建和目标 loader 要求的 lazy-CJS Client 包装器，确认 factory、模块 id、external、样式处理和依赖声明。
- 清单使用嵌套 dsh.bundle.patch、dsh.client；构建输出包含 Host、Client、类型和 patch。
- 确认共享 UI 框架不复制到插件包，组件不接收 ctx。
- 从预构建本地包和 tgz 安装，确认不依赖源码 preset 或安装时访问宿主源码。

### P0.3 面板与配置

- 向 sidebar.panellist 与 main 注册同一 panelId，显示四类静态示例卡片。
- 在没有会话、没有 Workspace 的冷启动下打开面板，确认独立入口和面板选择 API。
- 验证冷启动默认进入、恢复用户页面、离开面板的实际语义。默认进入的可见前台与后台启动要区分；不能用任意组件 mount/visibility 回调触发规划。
- 找到目标 ConfigEditor 正式入口，只修改本插件挂载行；验证配置重载不会覆盖已有业务数据。
- dataRoot 为 null、不存在或无权限时均能挂载引导页面；不得通过加载阶段文件检查使宿主失败。

### P0.4 HTTP、认证与卸载

- 注册 /daily-learning/api/ 的最小读接口和测试写接口；仅操作测试目录中的小型测试状态。
- 在目标版本核实 Connection 认证入口。若支持 requestRejection/admit，按其类型复用；不可凭名称自行伪造等效鉴权。
- 验证已登录同源访问，以及未认证、不可信 Host/Origin、未知 action、超限正文的拒绝行为。
- 验证 JSON 成功/错误能被 Client 正确展示，内部异常不会退化为空正文 400。
- 停用、启用、Client 重载、硬刷新和宿主重启：slot、路由、监听、锁没有重复或残留。

交付 docs/spike-report.md：每项记目标版本、最小代码位置、操作、日志/截图、结果和限制。Desktop 与 Web 分列，不相互代替。

退出门槛：左栏无会话入口、lazy-CJS、配置更新及受认证通信在首要目标 Desktop 上通过；Web 也完成独立记录。任何关键项失败即记录阻断，不开放无认证接口，不自动换右栏，不继续宣称支持该环境。允许继续纯领域开发，但不能把未通过的集成计为完成。

## 6. P1～P3：实现可靠的本地记录闭环

### P1 数据与存储

1. 定义并校验 spec §18 实体：LearningSpace、DayPlan、Task、WorkItem、RoleProfile、LearningPrompt、ProblemRef、RouteNode、Progress、Completion、ProcessedOperation、Source、PlanSnapshotStatus。区分学习 status 与 preparationStatus。
2. 明确任务状态转移、目标身份、completion 活动标记和版本字段。将完成/重开/替换等事实的真实时间及关联 ID 保存进操作历史，足以在未运行的午夜之后重建日内结果；仅保存当前 done 状态不足以恢复历史。
3. 实现可注入时钟与时区日期计算，保存建计划时的 timezoneAtCreation/dayStartAt/dayEndAt。时区修改只作用于未来，日期重复时复用已存在计划。
4. 运行时初始化 dataRoot：绝对路径、实际路径、插件目录归属、受管理文件、可创建性、可写性、单机目录约束。禁止覆盖同名非插件文件；不可识别所有同步盘时不做虚假的自动保证。
5. 单 Host 写入锁 + 进程内串行提交队列。验证 Windows 锁释放、异常退出后的恢复；不能只根据锁文件过期时间强夺另一个活动写入者。
6. LocalStore 采用同目录临时文件、可用的持久化手段和原子替换。分别验证 Windows 和 Web 所在服务机器的文件系统行为，不能默认所有平台都支持同样的 rename/fsync 语义。
7. state 提交后写日期和角色快照。维护待同步状态，刷新今日及旧日受影响快照；重启时从权威数据重建，不重新规划。
8. 每日首次写入前备份已有有效 state；迁移前另备份。成功提交后才清理，落实默认 30 天/30 份普通备份、3 份迁移备份及唯一恢复副本保护。
9. 未知未来 schema 拒绝写入；损坏 state 保留原文件并提供显式备份恢复。第一版若没有旧 schema，不制造无用迁移；仍建立迁移入口和未来版本拒绝测试。

P1 交付：schema、LocalStore、锁和快照写入器、备份恢复流程、故障注入测试。

### P2 日计划与业务规则

- ensureTodayPlan 是明确的写操作。按 learningSpaceId + localDate 唯一创建四个基础位置；已有计划只恢复。
- 实现 markStarted、confirmCompletion、recordProgress、reopenTask、deferTask、resumeTask、setCarryPolicy、editTask、replaceTask。
- 替换只允许当前未冻结计划的未完成项；原 Task 记 superseded，baseTaskIds 原子指向新有效项，每类仍恰好一个基础目标。
- 完成、理解声明、路线位置分开记录。完成不自动变成 understood，重复确认及旧日补完不重复推进路线。
- 追加走“候选预览 → 用户加入今日”。取消不创建 Task；正式加入才记录追加项，原 done 项保持完成。
- LLM/Agent 优先继续活动前置目标；needs_review 给复习候选。没有理解评测或聊天文件不阻止添加下一节。
- 续学按稳定 WorkItem 去重并按最早未完成排序。LLM/Agent 续学占基础位；算法/AI 保持新基础，旧目标进追加续学区。
- 2026-10-09 访谈补充：从通用 Agent 练习切入具体项目或更换当前项目时，旧上下文的未完成工程目标设为 carryPolicy=paused，保留归属和记录并进入待恢复列表；后续新日围绕新项目安排基础任务。已生成今日任务不自动编辑或替换，旧目标可手动恢复。
- 每类默认最多展开一个续学，LLM/Agent 基础续学占名额。其余保存在队列，不实例化到今天、不增加今日分母。显式追加不受这个名额限制，仍遵守序列前置关系。
- deferred 保留今日灰色卡片，auto 次日可带入；paused 进入待恢复列表；resumeTask 恢复 todo + auto；继续为 in_progress。
- 当前日取消完成影响当前 dayCompletion；结束日期由操作时间重建并冻结。后续补完/重开仅改变最终达成，不覆盖历史当日打卡。
- 用户在旧日确认补完时，今日关联目标显示已达成，但今日完成数仍等待用户明确确认。缺席日期不自动创建计划。

幂等顺序固定：先查 operationId 和规范化输入的 payloadHash；同 id 同输入返回已提交结果，同 id 不同输入拒绝。新 id 才校验 expectedRevision，过期返回冲突，不自动合并或重放。

P2 交付：DailyLearningService、规则函数、模板计划生成和可控日期下的业务测试。

### P3 模板模式的端到端闭环

- 正式业务 HTTP 接入服务层，固定读/写 action 白名单、参数 schema、正文上限和错误 envelope。
- GET 只读取。ensureTodayPlan、候选生成、正式添加和人工修改均为 POST；候选生成可能调用模型，即使没有加入计划，也不能伪装成只读 GET。
- Client 用同源 fetch，按实际应用挂载基址处理 URL；P0 验证，不能假设永远部署在站点根路径。
- 修改请求带 operationId/expectedRevision。成功刷新权威状态；冲突显示刷新提示，用户输入暂存在界面，不后台重放人工操作。
- 首次设置分两步：正式 ConfigEditor 保存环境字段，再初始化/恢复业务空间。已有 state 的角色、路线、时区优先，initialTimezone 只用于新空间。
- dataRoot 变更时停止旧目录作业、隔离旧结果、释放旧锁再激活新空间；旧响应不能写进新目录。切回原目录可恢复原进度。
- 无模型模式提供四类模板、手动编辑、勾选、记录、Prompt 复制。算法没有真实题源时明确“待选题”；AI 无来源时标为练习模板。
- 完成一次真实流程：配置目录 → 准备模板 → 勾选 → 查看 plan.json/plan.md → 重启 → 同日恢复 → 模拟次日续学。

P3 退出门槛：业务权威状态、受认证通信、面板和日期文件闭环可用。模型/来源接入尚未完成，不能在此结束第一版。

## 7. P4～P6：角色、来源与规划

### P4 四类角色、路线与可复制 Prompt

- RoleProfileService 保存四套独立文本预设，支持编辑、保存、单类恢复默认、版本化；不把角色正文写入宿主 Config。
- 默认算法导师、LLM 苏格拉底式引导、务实工程师、客观播报员。用户风格优先于默认语气；真实性和业务写入权限不受角色文本改变。
- LearningPromptBuilder 生成 role/goal/progress/steps/acceptance/materials/blockers/interaction 和确定性 text；空信息写未提供。
- 复制任务不含角色扩展，复制学习 Prompt 含角色；复制本身不标记开始或完成、不调用模型。
- 角色变化提供明确刷新 Prompt 操作，保存旧 taskVersion/roleProfileVersion 对应版本，保持任务目标不变。
- LLM 从用户声明的 Prompt 基础位置开始；默认路线含下一节点和前置关系。第一版以当前位置选择及简单节点文本调整实现“可编辑”，不做路线图。修改不回写旧任务或批量宣布前置掌握。
- 2026-10-09 访谈补充：LLM 内置路线以原理与实践为主，Prompt → token → embedding → Attention → Transformer → 训练与微调 → 对齐 → 推理，配小实验；应用系统实践归 Agent 工程。
- Agent 工程支持 project/source_study，用户填写背景或远程仓库 URL。任务包含输入、输出、验证场景；模块未知显示待定位。本地路径只作上下文，不读取项目。
- 2026-10-09 访谈补充：首版一个当前工程项目，可更换并保留旧记录。未提供项目时按内置 Agent 实作大类给任务概要（如实现工具调用），详情提供 60–120 分钟的步骤和验证；提供项目后按完善项目的角度规划。

P4 退出门槛：四类 Prompt 可直接粘贴到外部 AI；无聊天文件、无 notebook、无评测时，完成和下一项仍可操作。

### P5 LeetCode 与 AI 来源

LeetCodeSource：

- 分离 leetcode.cn/com 站点适配，记录站点每日题日期及检索时间。站点接口可能变化，集中在适配器，不散落到 UI。
- 先获取并验证真实题目元数据，再选择 Easy/Medium；Hard、未知难度、已完成每日题或获取失败回退到合格题池。
- 从适配器得到可验证的题池，随机只从满足约束的题池抽取；不能让模型编造题号或猜难度。冷启动无可用题池则显示待选题。
- 默认排除近 30 天已完成题、当日题及活动续学题；主动复习是显式例外。
- 手工填题也走元数据验证；无法验证不能标为合格 ready 题。缓存明确时间，不称为今日官方题。
- 保存 ProblemRef，输出摘要与官网链接，不默认附完整题解、登录或提交。

AIContentSource：

- 按兴趣检索近 7 天，必要时扩展至 30 天；最多一项主内容和两项备选。
- 2026-10-09 访谈补充：默认兴趣兼顾实用与研究，覆盖工具/产品/工作流和论文/模型/训练推理进展；每天一个主主题，约 25 分钟，兴趣可编辑。
- 核心内容至少读取一个原始来源。保存 URL、作者/机构、发布日期、检索时间、验证状态；发布时间未知不声称近期。
- 形成事实、变化、影响、可尝试动作；费用和条件未确认则说明未知。
- 失败使用有时间的缓存；无缓存用明确标记的非时效练习模板，不编造热门资讯。
- 工具体验任务不自动安装；完成可以是阅读后的判断或用户自行尝试。

共享实现：来源超时默认 15 秒、重试 1 次、网络并发 2；支持取消。对宿主 web 缺失/歧义/配置错误/取消/未知错误分别处理，不把错误码写成闭合集合。缓存可重建，不作为业务完成事实。

远程源码阅读只取得用户指定或任务明确相关的公开资料，保存 commit/tag 或读取时间；不扩展为本地扫描。

P5 测试以固定来源 fixtures 为主，另做少量真实联网 smoke。真实联网结果用于证明适配器可用，不以易变的热点排序作为回归断言。

### P6 宿主模型与结构化规划

- 通过宿主目录提供 provider/model 选择，用 resolveCallConfig 校验 route；目录存在不等于请求必然成功。
- 规划 Prompt 仅包含需要的用户任务信息、角色、路线、已验证资料和明确回填。外部网页作为资料，不作为执行配置或修改状态的命令。
- Planner 输出结构化候选：目标、理由、步骤、完成标准、资料引用、下一步；绑定真实 ProblemRef/RouteNode 等 ID，模型不能建立虚假来源。
- 最多一次格式修复；仍失败落回已验证资料和路线模板。规划默认超时 120 秒、并发 1；取消不会标记完成或新增任务。
- 初次准备按类别展示 preparing/ready/degraded/error；失败隔离，已有可用类别保留。模型不确认用户完成，也不自行跳过活动前置目标。
- previewNextTask 返回候选及所基于的 revision、任务/路线版本；候选确认时重新验证，过期要求刷新候选，不静默改写用户选择。

长耗时与并发实施顺序：

1. 前台明确动作获得 operationId，读取当前 revision 和上下文；对同日准备做 Host 单飞约束，对同一 operationId 的进行中请求复用处理。
2. 网络/模型阶段不长期持有文件提交锁，不阻塞人工记录。
3. 使用独立作业状态展示准备进度；它不是正式任务，也不能影响当日完成分母。作业的重试不重复收费调用；取消的候选不推进路线。
4. 提交时重新验证 expectedRevision、目标身份和作业所属学习空间。期间状态已改变则拒绝过期提交；不自动合并或重放。用户明确刷新后才能重新请求。
5. 同一天由其他标签已成功创建计划时，读取该唯一计划，不提交第二份；否则遵守冲突语义。
6. 卸载/切目录取消作业。进程崩溃后不在后台续跑付费规划；读历史与日期快照恢复不触发模型。只有新的合格前台动作可重新准备。

规划触发判定必须集中实现：用户进入尚未准备的今日工作台且 autoPrepareOnOpen=true，或点击准备/明确重规划/追加候选。午夜、轮询、纯读、窗口焦点恢复、最小化、后台启动均不能调用模型。已存在当日计划的 degraded 项也不因查看自动付费重试。

2026-10-09 访谈补充：autoPrepareOnOpen 默认开启，可在设置中关闭。任务工作量采用各类别独立预算，不限制每日总量：算法 30 分钟、LLM 30 分钟、Agent 工程 60–120 分钟、AI 探索约 25 分钟。预算用于规划任务粒度，不作强制计时或完成判定。

P6 退出门槛：四类候选可规划并正确降级；调用计数、取消、并发和过期候选行为有证据。

## 8. P7：完善工作台与历史

- 今日页展示日期、基础完成数/4、追加完成数及准备状态；四类栏目独立。
- 详情显示目标、选择原因、步骤、完成标准、来源、状态、基础/追加/续学、原始开始日、可选用时。
- 完整连接开始/继续、查看、编辑、替换、暂缓、记录、完成、重开、恢复、暂停自动带入、添加下一项和两种复制操作。
- done 项不直接替换；历史目标不能编辑/替换。按钮可用性与服务端前置条件一致，不能仅靠隐藏按钮。
- 追加候选可编辑、重新规划、加入或取消；取消保持今日原计划。模型未配置时显示配置入口，手动调整与模板能力继续可用。
- 展开续学和待恢复列表分开。折叠队列显示数量但不增加今日分母；提取时防重复，LLM/Agent 保持前置顺序。
- 历史日期列表与单日详情显示当日结果、最终达成、后来补完、基础和追加。无计划日期为未生成，不推断用户没学习。
- 设置页面区分环境配置和业务偏好。角色是四类独立字段；路线只给当前位置与下一节点及基础文本调整。
- 快照失败显示“计划已保存，日期文件待同步”；state 提交失败不能显示已保存。断网视图注明旧数据，禁止伪装写入成功。
- 刷新/回到可见时只拉状态；跨日提示不主动切面板。冷启动进入策略使用 P0 已验证接口。
- 完成浅/深主题、中文、键盘焦点与必要的空态/加载态/错误态；Markdown 不执行资料 HTML。

P7 退出门槛：用户无需使用 DSH 会话即可完整操作四类任务，在外部 AI 学习后只靠人工回填继续推进。

## 9. P8：测试与验收矩阵

测试重点是状态、时间、落盘、调用边界和真实宿主集成。纯规则使用注入时钟/来源/模型；文件写入使用临时测试目录及故障注入；宿主能力用目标 Desktop/Web 实装，不用模拟 ctx 代替兼容验证。

| 测试组 | 关键场景 | 对应验收 |
| --- | --- | --- |
| T01 集成入口 | 无会话/Workspace、冷启动、dump-config、硬刷新、重启、预构建 tgz | AC-01、AC-32 |
| T02 配置与恢复 | null、不存在目录、权限失败、重选原目录、业务值优先、无模型 | AC-02、AC-20、AC-24、AC-29 |
| T03 基础任务内容 | ready 必备内容、degraded 标记、真实来源、模板缺失原因 | AC-03 |
| T04 算法 | Hard/未知难度拒绝、每日题回退、随机避重、活动题排除、缓存时间 | AC-04 |
| T05 追加 | A 完成追加 B、候选取消、重复提交、过期候选、原 done 保持 | AC-05、AC-06、AC-08 |
| T06 续学 | 四类跨日差异、超过一项折叠、WorkItem 去重、paused/auto、resume | AC-07、AC-09、AC-28 |
| T07 角色与复制 | 单类编辑、重启恢复、Prompt 版本、复制不修改学习状态、不打开会话 | AC-10、AC-11、AC-12、AC-13 |
| T08 学习推进 | Prompt 起点、无评测继续、needs_review、工程输入输出/待定位、不读本地项目 | AC-21、AC-22 |
| T09 历史与时区 | 日界前后完成/重开、隔天补完、缺席日、时区日期重合、两种完成口径 | AC-15、AC-16、AC-23 |
| T10 快照与故障 | 权威提交前后中断、今日/旧日更新、快照待同步、重建、损坏/未知 schema | AC-14、AC-18、AC-23 |
| T11 来源/模型降级 | 断网、provider 缺失/歧义、未知错误、缓存时效、格式失败、超时取消 | AC-17、AC-24 |
| T12 调用边界 | 午夜、后台、最小化、焦点恢复、GET、已存在计划恢复均零规划调用 | AC-26、AC-24 |
| T13 幂等与冲突 | 同 id 同输入、同 id 异输入、新 id 旧 revision、两标签准备/追加/勾选 | AC-02、AC-06、AC-27、AC-31 |
| T14 权限与通道 | 未认证/Host/Origin、未知 action、任意路径、正文大小、JSON 错误、ConfigEditor 行边界 | AC-25、AC-30、AC-31 |
| T15 生命周期 | 停用/启用、HMR、硬刷新、取消请求、锁/监听/slot/路由不重复、保留数据 | AC-19、AC-30、AC-32 |
| T16 备份与边界 | 首次日写/迁移备份、30天/30份/3份、保护唯一恢复副本、数据目录外不写 | AC-18、AC-25、AC-29 |

必须保留以下用户场景作为端到端回归：

1. 今日四项基础全完成；追加 LLM B 未完成。今日仍显示基础 4/4，明日 B 成为 LLM 基础续学。
2. 算法/AI 有旧未完成目标；今日仍生成新基础，旧项进入续学区；过多旧项折叠，不偷偷增加分母。
3. 使用 GPT 完成学习，不导出聊天、不交 notebook、不填理解评测；返回直接完成并追加。
4. 23:59 完成三项，次日才补完第四项；旧日当日结果保持 3/4，最终达成显示补完。
5. 离开 DSH 三天再打开；不补建三天计划，不后台调用模型，旧目标按规则续学。
6. 两标签准备同一天/重复加入同一候选；最多一个计划/追加实例。较旧 revision 的人工修改明确冲突。
7. state 已成功保存但 plan.md 写入失败；界面提示待同步，重启重建，既不丢完成记录也不重复规划。
8. 路径未配置/不可写、模型缺失、来源失败分别发生；插件仍可加载，历史保留，失败范围不扩散。

docs/acceptance.md 对每个 AC 单独记录：目标环境、操作、预期、实际、证据、通过/失败/未验证。自动测试通过不替代 UI 和发布包安装验证。

出现失败只扩大与问题相关的测试范围；修复后复验受影响场景。不得把未执行项填为通过，也不为低影响文案调整追加重复测试。

## 10. FR 到工作包的追踪

| 需求 | 主要实现阶段 | 关键证据 |
| --- | --- | --- |
| FR-01 加载安全 | P0、P1、P3 | T02 |
| FR-02 工作台 | P0、P3、P7 | T01、T07 |
| FR-03 日计划/触发/时区 | P2、P6 | T09、T12、T13 |
| FR-04 添加下一项 | P2、P6、P7 | T05 |
| FR-05 续学 | P2、P7 | T06 |
| FR-06 算法 | P5 | T03、T04 |
| FR-07 LLM | P4、P6 | T08 |
| FR-08 工程 | P4–P6 | T08 |
| FR-09 AI 探索 | P5、P6 | T03、T11 |
| FR-10 独立角色 | P4、P7 | T07 |
| FR-11 人工完成 | P2、P3、P7 | T05、T07、T09 |
| FR-12 日期文件 | P1、P3 | T10 |
| FR-13 历史口径 | P2、P7 | T09 |
| FR-14 一致性 | P1、P2、P6 | T10、T13 |
| FR-15 数据结构 | P1 | T09、T10 |
| FR-16 规划模块/宿主模型 | P4–P6 | T08、T11、T12 |
| FR-17 边界/生命周期 | P0、P1、P3、P9 | T14、T15、T16 |
| FR-18 Host/Client 通道 | P0、P3 | T13、T14 |
| FR-19 构建安装 | P0、P9 | T01、T15 |

## 11. P9：发布与交付

1. 输出 Host ESM、Client lazy-CJS、类型声明和 cordis.patch.yml；检查 package files/exports、嵌套 dsh 元数据和精确依赖。
2. 用打包工具的文件清单确认产物，无绝对开发路径、源码 preset 依赖、测试数据或密钥。
3. 清洁测试 profile 安装预构建 tgz；以同一运行时执行 dump-config，实际打开左栏面板，完成一次配置、勾选和重启恢复。
4. 分别记录 Desktop/Web 的安装、冷启动、硬刷新、停用启用和重启结果；只对通过的环境宣称支持。远程服务的 dataRoot 位于服务机器，不宣称自动写到浏览器用户电脑。
5. docs/install.md 给出匹配目标 CLI 的开发 overlay、本地包/tgz 安装、启用确认和停用方法。最终命令在目标版本验证后写入，不在 P0 前给未经验证的生产命令。
6. docs/recovery.md 说明 dataRoot、权威状态与快照区别、目录重选、备份恢复、只读未知版本、待同步处理。停用/移除插件保留用户数据；不自动删目录或改 ACL。
7. docs/compatibility.md 填写实际插件版本、DSH/commit、依赖、Node、profile、结果及已知限制。

本计划默认交付可审查的本地安装包与文档。公开 npm 发布、云部署及更改用户现有生产 profile 不属于文档编写阶段，也不把公开发布当作完成本地插件的前提。

最终交付清单：源代码、锁文件、预构建 tgz、构建脚本、安装/恢复说明、spike 报告、兼容表、AC 验收记录。示例目录使用模拟数据，不包含用户真实聊天或密钥。

## 12. 阻断与处理规则

| 风险 | 最早验证 | 处理 |
| --- | --- | --- |
| lazy-CJS 与目标 loader 不匹配 | P0 | 调整自建构建并实装复验；不改成普通浏览器 ESM |
| 左栏无会话入口不可用 | P0 | 记录版本/能力缺口；不静默换右栏或聊天卡片 |
| Connection 认证接口无法复用 | P0 | 不启用业务 HTTP；记录具体缺口，重新裁决通信方案 |
| ConfigEditor 正式入口不可用 | P0 | 查目标官方实现；不手写 profile，不伪造 settings namespace |
| 实际 npm 包版本/导出不同 | P0 | 逐包确认和锁定；不把 next 当固定兼容承诺 |
| Windows 替换/锁行为有差异 | P1 | 故障注入和恢复实测；不交付会丢记录的写入方案 |
| 来源接口变化或 provider 不可用 | P5 | 适配器隔离、明确缓存/模板；不编造题目或资讯 |
| 模型返回非法结构/过期计划 | P6 | 校验、一次修复、降级或冲突；保留人工记录 |
| 两实例写同一数据目录 | P1/P8 | 第二写入者拒绝写入，诊断可见；不尝试多机同步 |
| 历史日内结果被后来补完覆盖 | P2/P8 | 操作时间重建 + 冻结规则；作为交付阻断 |

阻断项须有具体环境、复现、证据和可行替代，不以“理论可用”关闭。若替代改变已确认需求，先把变更写成可审查的 spec 差异，再请求裁决；常规内部实现选择按本计划继续。

## 13. 完成定义与参考

第一版完成需要同时满足：

- spec FR-01～FR-19 均有实现及验收证据，AC-01～AC-32 无未解决阻断；环境范围诚实登记。
- 无会话可访问全局工作台；未配置路径/模型也能加载。
- 四类任务、角色自定义、来源、复制 Prompt、人工完成、追加、续学、简单历史均可用。
- 日期落盘、跨日冻结、幂等冲突、备份恢复和卸载保留数据经验证。
- 模型只由合格前台动作触发，资料/模型失败不破坏已有记录。
- 预构建包在目标 profile 实装，不能只交源码或安装成功日志。

实施开始时先执行 P0，不从完整规划器或复杂 UI 开始。本计划不承诺未经 spike 评估的工期；P0 完成后根据实际阻断、版本和可运行构建估算剩余工作，里程碑范围保持不变。

参考文档：

- 本项目 [spec v0.3](dsh-daily-learning-spec.md)：产品行为与验收权威；本计划不替换它。
- 用户上传的 spec-review-v0.2：本机版本及第三方静态证据；不作为本插件运行通过证明。
- [官方插件发布](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)：bundle/patch、profile 安装、共享依赖和启用检查。
- [官方 Client Modules](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/client-modules.md)：客户端模块表和 lazy-CJS 机制。
- [官方 Web Server/Connection](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-server.md)：命名路由、清理和认证入口。
- [官方 slots](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/slots.md)、[config](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/config.md)、[llm-streaming](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/llm-streaming.md)、[web](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web.md)：实施时对照固定目标版本。

计划编写时核对了 spec v0.3 及官方 master 的 publish/client-modules/web-server 文档。目标机器验证、构建和业务测试均留在以上实施阶段，未在本次文档工作中执行。
