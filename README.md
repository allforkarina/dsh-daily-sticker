# DSH Daily Learning

GitHub 仓库：`allforkarina/dsh-daily-sticker`。安装后的插件包名为 `dsh-daily-learning`，左栏入口为「每日学习」。

DeepSeek Harness 的每日学习任务备忘录。打开左栏「每日学习」，查看算法、LLM、Agent 工程、AI 探索四类任务，复制到你喜欢的 Agent 工具中开展学习。回到这里勾选整个任务即可。

默认独立预算：算法 30 分钟，LLM 30 分钟，Agent 工程 60–120 分钟，AI 探索约 25 分钟。

LLM 以原理与小实验为主；工程先给「实现工具调用」等大类目标，有具体项目后围绕项目完善规划；探索兼顾工具实践与研究。偏好、时间和复制 Prompt 的角色文本可在折叠设置中调整。

**0.2.0 支持自由文本学习需求与阶段路线。** 每类分别粘贴你想学的内容、已有基础和偏好，宿主模型整理整体目标、完整学习阶段及预计天数，再按每日时间预算生成具体任务。完成勾选用于推进阶段。改变方向时修改需求并重新生成路线，旧路线与任务保留。

插件只负责每日规划和展示。外部学习、Markdown 聊天导出、交给 notebook 助手整理笔记，由你自行完成。

## 安装

在 DSH 的「添加插件」输入框填写 npm 包名：

```text
dsh-daily-learning
```

或通过 CLI 安装指定版本：

```powershell
dsh plugin --profile desktop add "dsh-daily-learning@0.2.0" --registry=https://registry.npmjs.org/
```

适配目标：DeepSeek Harness **0.2.0-rc.2**，Node **24**。其他版本的结果见 [兼容记录](docs/compatibility.md)。

下载预构建 `dsh-daily-learning-0.2.0.tgz` 后，在 DSH CLI 中安装到你的 profile：

```powershell
dsh plugin --profile desktop add "D:\Downloads\dsh-daily-learning-0.2.0.tgz"
```

Web 用户将 `desktop` 换为 `web` 或自己的 profile 名称。安装后重启宿主；Web 页面再硬刷新。完整步骤见 [安装说明](docs/install.md)。

也可直接从 GitHub 安装：

```powershell
dsh plugin --profile desktop add "github:allforkarina/dsh-daily-sticker#main"
```

仓库已经包含 `lib/`。预构建安装包保存在 [release/dsh-daily-learning-0.2.0.tgz](release/dsh-daily-learning-0.2.0.tgz)，可直接下载后按上面的本地包命令安装。

源代码上传 GitHub 时保留 `lib/`、`package.json` 和 `cordis.patch.yml`；它们是可直接加载的插件产物。不要上传 `node_modules/`、`.target-cache/`、`.test-runtime/` 或自己的学习目录。

如果 DSH 界面无法通过 HTTPS 访问 GitHub，已经配置 GitHub SSH 身份的机器可填入以下地址。它已通过目标预览版的原生 GitHub 连接预检：

```text
git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main
```

## 使用

1. 打开「每日学习」，设置一个空的本地数据目录。
2. 可选：选择宿主已配置的模型；这里不填写 API Key。无模型也能使用模板。
3. 准备今日任务，复制任务或学习 Prompt，在外部工具完成学习。
4. 返回勾选完成。无需学习记录、步骤进度或理解评测。

### 自定义学习路线

1. 选择宿主模型，展开设置中的「学习需求与路线」。
2. 为算法、LLM、Agent 工程或 AI 探索粘贴自由文本需求，每类最多 12000 字符，支持换行和 Markdown。例如：“我想理解 Attention 和 Transformer，目前只了解 Python，偏手算与最小代码实验，每天 30 分钟。”
3. 保存需求后，点击该类「生成路线」。模型生成全部阶段、目标和按每日预算估算的天数。展开查看路线即可，无需再逐章填写计划。
4. 点击「重新规划未完成项」，让今日未完成任务使用新路线；以后按当前阶段安排。
5. 完成一个每日任务计一天；达到阶段预计天数后进入下一阶段，未完成则继续。勾选不等于掌握评测。取消勾选会影响后续安排，已经保存的任务不自动改写。
6. 修改需求后，旧路线继续有效，直到明确点击「重新生成路线」。生成失败保留旧路线；成功后创建新的路线版本，结合历史摘要重新安排，不把旧进度机械套到新路线。

清空某类需求并保存会停用该类路线，后续使用默认规划，历史版本仍保留。修改每日预算后，新任务采用新预算；路线天数仍是生成时的估算，可重新生成更新。完整路线结束后安排复习或综合实践，你也可以输入新的方向。

路线生成需要模型；无模型时不解析自由文本。每日模型失败时显示当前阶段的目标和模板，并明确提示尚未细化。算法及资讯仍要求真实可验证来源，检索不匹配会说明限制。

首次进入尚未准备的今日面板时自动准备；可在设置中关闭。已有计划直接恢复，不因午夜、刷新或焦点恢复自动再次调用模型。「重新规划未完成项」是明确的重新请求，已完成任务保留。

模型和检索使用宿主能力。检索失败会显示模板、待选题或缓存时间；不会把练习模板当作最新资讯。

## 数据与开发

权威文件为 `<dataRoot>/store/state.json`，日期快照为 `<dataRoot>/days/YYYY-MM-DD/plan.json` 与 `plan.md`，路线快照为 `<dataRoot>/routes/<类别>/<路线ID>.json` 与 `.md`。停用或卸载保留这些数据。0.1.0 数据升级时先保存原始备份；新版 schema 2 无法直接被 0.1.0 打开。恢复方法见 [恢复说明](docs/recovery.md)。

```powershell
node --test tests/*.test.mjs
node scripts/build.mjs
pnpm pack --pack-destination dist
```

构建使用 Node 24 内置 TypeScript 去类型能力，不打包宿主 React 和 Cordis。基础范围见 [精简规格](docs/daily-planner-spec-v0.4.md)，新增路线功能见 [0.2.0 已确认设计](docs/superpowers/specs/2026-10-10-custom-learning-planning-design.md)。旧规格与旧计划仅留作历史参考。
