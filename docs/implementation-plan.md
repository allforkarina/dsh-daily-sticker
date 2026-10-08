# 每日任务备忘录 — 精简实施计划

日期：2026-10-09。范围以用户已确认的 `daily-planner-spec-v0.4.md` 为准。

**Goal:** 构建可安装的 DSH 每日四类任务规划插件，提供备忘录展示、复制和简单完成勾选。

**Architecture:** 纯任务模块负责默认偏好、模板与 Prompt；本地存储负责日期恢复和串行原子提交；规划器连接宿主模型与真实来源；Host 注册正式 webServer 命名路由并复用 Connection 准入，Client 使用官方 Connection carrier 并注册左栏与主面板。仅必要设置，所有学习在外部工具完成。

**Tech Stack:** Node 24、TypeScript ESM、宿主 React、lazy-CJS Client、Node 内置 test runner。使用 Node 内置 TypeScript stripping 构建，减少开发依赖；不复制共享 UI 框架。

## 工作项

- [x] 核对本机 0.2.0-rc.2 公开安装接口：Client lazy factory、sidebar.panellist/main、Connection rpc、ConfigEditor.edit、ctx.llm.stream、ctx.web.search/fetch。
- [x] 为以下行为先建立失败测试：四类模板和预算、日期/输入验证、Prompt复制不修改状态、模型不能伪造来源、同日唯一准备、纯读不规划、保存/重启恢复、过期提交冲突。
- [x] 实现 `src/domain.ts`：四类偏好、轻量主题主线、日期、任务/Prompt确定性渲染和输入校验。
- [x] 实现 `src/store.ts`：受管理目录标识、单写入锁、串行原子 state 提交、日期 JSON/Markdown 派生文件、备份和快照待同步。
- [x] 实现 `src/planner.ts` 与 `src/sources.ts`：模板、模型结构校验、验证来源、超时取消、失败降级；单次规划不读取本地项目。
- [x] 实现 `src/service.ts`、`src/host.ts`：恢复已有日计划、明确重规划、勾选、偏好、目录/模型配置与限界命名接口。重规划保留已完成项，生成期间人工修改触发冲突。
- [x] 实现 `src/client.cjs` 和 `src/client.css`：窄幅备忘录布局、四类概要、展开建议、复制、简单勾选、日期选择和折叠设置；面板未被明确前台选中时不自动规划。
- [x] 实现 `scripts/build.mjs`：输出 ESM Host 与 lazy-CJS Client；打包文件不依赖目标缓存或开发绝对路径。
- [x] 测试通过后使用目标 CLI 的独立 profile 验证加载、通信认证与配置；真实 UI 验证后打包。
- [x] 交付 `README.md`、兼容/恢复/验收说明、预构建 tgz。实测结果与未验证项分别登记。

完成记录：24项核心测试通过；最终 tgz 的独立实装、配置失败重试、复制、勾选、刷新和宿主重启恢复均通过，重启恢复零规划请求。原生 Desktop 窗口未验证。测试服务已停止。

## 验证与边界

自动测试使用 `node --test tests/*.test.mjs`，构建使用 `node scripts/build.mjs`。文件测试写临时目录，宿主测试仅写项目 `.test-runtime`。使用生产 profile 的只读公共代码核对，不读取生产凭据，不在现有 profile 安装插件。

Connection 命名通道使用官方 RPC 信封，仍是受宿主认证保护的命名 HTTP 接口，在 Client 使用宿主 Connection carrier，以适配 Desktop/Web 的实际页面载体；不需要 Typert 生成器。所有操作均通过 action 白名单。宿主认证负责准入，插件负责输入及业务权限边界。

用户已授权当前会话实施，不再请求开发方式选择；逐项执行并在功能完成后进行独立代码审查。
