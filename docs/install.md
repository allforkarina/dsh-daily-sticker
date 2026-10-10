# 安装与启用

目标版本：DSH 0.2.0-rc.2。发行包已经包含 ESM Host、lazy-CJS Client、声明文件和 bundle patch，无需安装后编译。

## npm 安装

在「添加插件」输入框填写 `dsh-daily-learning`，安装源选择 npm 官方源。

```powershell
dsh plugin --profile desktop add "dsh-daily-learning@0.2.0" --registry=https://registry.npmjs.org/
```

`dsh-daily-sticker` 是 GitHub 仓库名，npm 包名和卸载时使用的名称均为 `dsh-daily-learning`。

## 从 0.1.0 更新

在 DSH 插件页移除旧插件，再添加 `dsh-daily-learning@0.2.0`，选择 npm 官方源。完全重启 DSH 后打开「每日学习」，如需重新配置目录，选择原 dataRoot 即可恢复；卸载插件不会删除该目录。

首次打开原目录会先备份旧状态，再升级为 schema 2，保留历史任务、角色及勾选。升级和回退限制见 [恢复说明](recovery.md)。选择宿主模型，在「学习需求与路线」粘贴自由文本，保存后点击该类「生成路线」。已有今日任务需要点击「重新规划未完成项」才应用新路线。

## 预构建包

```powershell
dsh plugin --profile desktop add "D:\Downloads\dsh-daily-learning-0.2.0.tgz"
```

Web 使用 `--profile web`；自定义 profile 使用对应名称。此命令使用 DSH 官方插件安装通道，不要手工替换宿主文件。

安装后完全重启 DSH。Web 用户硬刷新页面。左栏应出现「每日学习」。可用以下命令检查组合配置中的 `dsh-daily-learning` 行：

```powershell
dsh --profile desktop --dump-config
```

如果没有入口，先核对宿主版本与该行是否启用，再检查 Host/Client 加载日志。

## 首次使用

打开「每日学习」，输入一个空的本地绝对数据目录，例如 `D:\Learning\DailyPlans`。已有本插件目录可直接重选以恢复；首次使用不会覆盖非空的未知目录。

模型可暂不选择。选择模型时使用宿主已经配置的 provider/model，无需向插件提供密钥。来源检索也使用宿主 Web provider；LeetCode 元数据通过公开站点适配器取得。

设置保存通过宿主 ConfigEditor 更新本插件挂载行。角色、时间预算、项目背景、兴趣及学习需求作为业务偏好保存在数据目录。生成路线需要宿主模型，需求保存和路线生成是独立操作。已保存日期不会因更改偏好或路线被自动覆写。

Web 的数据目录在服务机器上，浏览器电脑上的路径不能代替服务机器路径。

## 本地源代码和 GitHub

本仓库可直接安装：

```powershell
dsh plugin --profile desktop add "github:allforkarina/dsh-daily-sticker#main"
```

如果当前 Windows 终端找不到 `dsh`，本机已核实的 Desktop CLI 路径为：

```powershell
& "D:\Software\DSH\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add "github:allforkarina/dsh-daily-sticker#main"
```

其他机器请使用自己的 DSH 安装目录。仓库的 `release/` 同时提供预构建 tgz；这条本地包安装路径已完成独立实装验证，GitHub 安装的网络访问仍取决于本机 Git/npm 环境。

DSH 界面的 HTTPS GitHub 连接预检若失败，已有 GitHub SSH 身份的机器可在同一输入框填写 `git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main`，无需改动宿主源码或全局 Git 配置。

本地开发先运行 `node scripts/build.mjs`，然后可用官方安装通道安装项目绝对路径。

仓库保留 `lib/`，并在 `release/` 提供预构建 tgz。下载后按本地包命令安装，不依赖安装机器的构建环境。

后续修改代码时提高 package.json 中的版本，再构建与打包，避免同版本本地包缓存影响更新。

## 停用与卸载

可在宿主插件页停用；移除包使用：

```powershell
dsh plugin --profile desktop remove dsh-daily-learning
```

停用、移除后重启宿主。数据目录不会自动删除。
