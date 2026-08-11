# Figma Agent Kit 插件发版指南

插件**不发 npm**。分发包是 ZIP，挂在 **GitHub Releases**，并更新 `releases/version.json`（插件内更新检查）。

MCP（`figma-agent-mcp`）走 npm，见 [mcp-release.md](./mcp-release.md)。

## 产物结构

```text
releases/
  version.json                          # latest / notes / downloadUrl（提交到 main）
  figma-agent-plugin-v0.1.0.zip         # GitHub Release 附件（不进 git）
  figma-agent-plugin-v0.1.0/            # 本地解压校验目录（不进 git）
    manifest.json
    dist/code.js
```

`downloadUrl` 形如：

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-v0.1.0/figma-agent-plugin-v0.1.0.zip
```

## 日常发版

工作区干净时：

```bash
# 预览
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

# bump → CHANGELOG → build → ZIP → version.json → commit → tag → push
# → Actions 创建 GitHub Release（标题/说明/ZIP）
pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

只打包不推送：

```bash
pnpm pack:plugin
```

## 测试 CI 打包

```bash
gh workflow run pack-plugin.yml
```

Artifacts：`figma-agent-plugin-pack`。

## 用户如何安装某版本

1. 打开仓库 **Releases**，下载 `figma-agent-plugin-vX.Y.Z.zip`
2. 解压
3. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
4. 选择解压目录里的 `manifest.json`

## Tag 约定

```text
figma-agent-plugin-v0.1.0
```

## 相关文件

| 路径 | 说明 |
|------|------|
| `packages/figma-agent-plugin/scripts/assemble-release.mjs` | 组装 ZIP + version.json |
| `packages/figma-agent-plugin/scripts/release.mjs` | bump / tag |
| `packages/figma-agent-plugin/CHANGELOG.md` | 版本说明 |
| `.github/workflows/release-plugin.yml` | 打 Release |
| `.github/workflows/pack-plugin.yml` | 仅验证打包 |
| `releases/version.json` | 插件更新检查源 |
