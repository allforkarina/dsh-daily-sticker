# DSH Daily Learning

GitHub 仓库：`allforkarina/dsh-daily-sticker`。安装后的插件包名为 `dsh-daily-learning`，左栏入口为「每日学习」。

DeepSeek Harness 的每日学习任务备忘录。打开左栏「每日学习」，查看算法、LLM、Agent 工程、AI 探索四类任务，复制到你喜欢的 Agent 工具中开展学习。回到这里勾选整个任务即可。

默认独立预算：算法 30 分钟，LLM 30 分钟，Agent 工程 60–120 分钟，AI 探索约 25 分钟。

LLM 以原理与小实验为主；工程先给「实现工具调用」等大类目标，有具体项目后围绕项目完善规划；探索兼顾工具实践与研究。偏好、时间和复制 Prompt 的角色文本可在折叠设置中调整。

插件只负责每日规划和展示。外部学习、Markdown 聊天导出、交给 notebook 助手整理笔记，由你自行完成。

## 安装

适配目标：DeepSeek Harness **0.2.0-rc.2**，Node **24**。其他版本的结果见 [兼容记录](docs/compatibility.md)。

下载预构建 `dsh-daily-learning-0.1.0.tgz` 后，在 DSH CLI 中安装到你的 profile：

```powershell
dsh plugin --profile desktop add "D:\Downloads\dsh-daily-learning-0.1.0.tgz"
```

Web 用户将 `desktop` 换为 `web` 或自己的 profile 名称。安装后重启宿主；Web 页面再硬刷新。完整步骤见 [安装说明](docs/install.md)。

也可直接从 GitHub 安装：

```powershell
dsh plugin --profile desktop add "github:allforkarina/dsh-daily-sticker#main"
```

仓库已经包含 `lib/`。预构建安装包保存在 [release/dsh-daily-learning-0.1.0.tgz](release/dsh-daily-learning-0.1.0.tgz)，可直接下载后按上面的本地包命令安装。

源代码上传 GitHub 时保留 `lib/`、`package.json` 和 `cordis.patch.yml`；它们是可直接加载的插件产物。不要上传 `node_modules/`、`.target-cache/`、`.test-runtime/` 或自己的学习目录。无需发布到 npm。

## 使用

1. 打开「每日学习」，设置一个空的本地数据目录。
2. 可选：选择宿主已配置的模型；这里不填写 API Key。无模型也能使用模板。
3. 准备今日任务，复制任务或学习 Prompt，在外部工具完成学习。
4. 返回勾选完成。无需学习记录、步骤进度或理解评测。

首次进入尚未准备的今日面板时自动准备；可在设置中关闭。已有计划直接恢复，不因午夜、刷新或焦点恢复自动再次调用模型。「重新规划未完成项」是明确的重新请求，已完成任务保留。

模型和检索使用宿主能力。检索失败会显示模板、待选题或缓存时间；不会把练习模板当作最新资讯。

## 数据与开发

权威文件为 `<dataRoot>/store/state.json`，日期快照为 `<dataRoot>/days/YYYY-MM-DD/plan.json` 与 `plan.md`。停用或卸载保留这些数据。恢复方法见 [恢复说明](docs/recovery.md)。

```powershell
node --test tests/*.test.mjs
node scripts/build.mjs
pnpm pack --pack-destination dist
```

构建使用 Node 24 内置 TypeScript 去类型能力，不打包宿主 React 和 Cordis。产品范围以 [已确认精简规格](docs/daily-planner-spec-v0.4.md) 为准，旧规格与旧计划仅留作历史参考。
