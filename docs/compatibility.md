# 兼容与实测范围

日期：2026-10-09。插件：dsh-daily-learning 0.1.0。

目标安装：Windows x64，DSH 0.2.0-rc.2（安装包 commit 04f392c9），Node 24.21.0、pnpm 11.7.0。Host 消费的 peer 固定为 Schemastery 3.18.4、dsh-llm 0.2.0-rc.2，Client 复用宿主 React/slot/layout/Connection。

| 环境或路径 | 实测结果 |
| --- | --- |
| 本机 Desktop 安装附带 CLI，独立 Web profile | Host/Client 实际加载；无会话进入左栏备忘录、正式配置保存、四类任务、勾选、复制与硬刷新恢复通过。 |
| 同一真实宿主的模型 seam | 通过宿主 LlmAdapter 注册本地测试模型，经过 resolveCallConfig/stream/校验/保存的整条路径通过；夹具不发起外部模型请求。 |
| 来源 | LeetCode 公开元数据取得真实 Easy/Medium 题目；AI 来源使用固定夹具验证读取、绑定和降级。未配置宿主搜索凭据的失败路径通过。 |
| 原生 Desktop 窗口 | 尚未实测。已核对目标安装与公共扩展接口，不能把独立 Web profile 结果当成原生窗口验收。 |
| 其他 DSH/Node 版本、远程部署、Linux/macOS | 尚未验证。 |

发行包安装仍需宿主提供对应 peer；目标 CLI 的 pnpm 安装可能提示缺少物理 peer，运行时由 DSH 的官方包解析环境提供。是否成功以实际 Host/Client 加载及 `--dump-config` 为准，不能仅看包安装退出码。

## 接入记录

Client 是 `window.__ModuleLoader__.load({id,factory})`，注册 `sidebar.panellist` 和同 key 的 `main`。组件只接收注入的 API 和前台选择状态，不接收 ctx。

目标版 `connection.rpc.handle` 实装时出现其内部 `webServer` 依赖声明错误，因此使用 `ctx.webServer.register` 的命名 prefix 路由及 `ctx.connection.requestRejection` 准入。Client 仍通过官方 `connection.rpc.call` 发送相关性校验信封。prefix 注册为 `/daily-learning`，不带末尾斜杠；接口路径为 `/daily-learning/<action>`。

未认证请求返回 401，不可信 Origin 返回 403；正文限额与 action/schema 验证由插件完成。插件不开放任意文件操作或 API Key 表单。

自动化浏览器控制工具因当前机器沙箱启动失败不可用，UI 验证改用已安装 Edge 的 headless Playwright 实例。页面无浏览器错误。首次预览说明和宿主密钥引导只在隔离页面中点击继续/稍后配置，未填写生产凭据。
