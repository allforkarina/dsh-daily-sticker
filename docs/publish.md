# 发布与安装来源

插件 npm 包名：`dsh-daily-learning`。GitHub 仓库：`allforkarina/dsh-daily-sticker`。两者不是同一个名称。

## npm 发布

包内已配置官方 registry 与 public access，发行包只含预构建产物和必要文档。

```powershell
node scripts/build.mjs
pnpm pack --pack-destination dist
npm login --registry=https://registry.npmjs.org/
npm publish ".\dist\dsh-daily-learning-0.1.0.tgz" --access public --registry=https://registry.npmjs.org/
```

使用当前版本对应的文件名。npm 发布需要账号的双因素认证；设备认证通过 npm 提供的网页完成，不把密码、验证码、恢复码或 token 写到仓库中。发布返回成功后仍可能等待 registry 处理，必须实际查询版本及安装后才能宣称可用。

```powershell
npm view dsh-daily-learning@0.1.0 version --registry=https://registry.npmjs.org/
dsh plugin --profile desktop add "dsh-daily-learning@0.1.0" --registry=https://registry.npmjs.org/
```

发布过的同名版本不能覆盖；后续更新提高 package.json 版本，重建并重新发布。

## GitHub 安装

仓库包含预构建 `lib/`。标准 GitHub 输入为 `github:allforkarina/dsh-daily-sticker#main` 或完整 HTTPS 仓库地址。

目标 DSH 预览版的 GUI 在安装前会运行 `git ls-remote` 做连接预检。HTTPS 预检失败会中止安装，即使其他途径能下载仓库。已有 GitHub SSH 身份的机器可以使用：

```text
git+ssh://git@github.com/allforkarina/dsh-daily-sticker.git#main
```

这个地址已通过当前安装的原生连接预检，并通过独立 DSH GUI 的添加插件窗口完成安装验证。
