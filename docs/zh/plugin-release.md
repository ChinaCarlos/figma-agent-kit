# 发布 Figma 插件

[English](../plugin-release.md) | **简体中文**

插件**不发 npm**。分发包是 **GitHub Releases** 上的 **ZIP**，并更新 [`releases/version.json`](../../releases/version.json) 供插件内检查更新。

MCP npm 发版见 [mcp-release.md](./mcp-release.md)。

## 产物结构

```text
releases/
  version.json                          # latest / notes / downloadUrl（提交到 main）
  figma-agent-plugin-vX.Y.Z.zip         # GitHub Release 附件（gitignore）
  figma-agent-plugin-vX.Y.Z/            # 本地解压校验（gitignore）
    manifest.json
    dist/code.js
```

示例 `downloadUrl`：

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-vX.Y.Z/figma-agent-plugin-vX.Y.Z.zip
```

## 日常发版

工作区干净时：

```bash
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

推荐与 MCP 共发：

```bash
pnpm release:kit:patch
```

只打包不推送：

```bash
pnpm pack:plugin
```

## 仅 CI 打包

```bash
gh workflow run pack-plugin.yml
```

产物：`figma-agent-plugin-pack`。

## 安装某个 Release

1. 打开仓库 **Releases**
2. 下载 `figma-agent-plugin-vX.Y.Z.zip`
3. 解压
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 选择解压目录中的 `manifest.json`

## Tag 约定

```text
figma-agent-plugin-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-plugin/CHANGELOG.md`](../../packages/figma-agent-plugin/CHANGELOG.md) 必须保留 `## [Unreleased]`。

## 相关

- [AI 功能](./ai-features.md) — 更新检查 URL
- [MCP 发版](./mcp-release.md)
