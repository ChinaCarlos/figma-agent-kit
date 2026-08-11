# 发布 figma-agent-mcp

[English](../mcp-release.md) | **简体中文**

公开 npm 包：[`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

## 职责分工

| 步骤 | 在哪做 |
|------|--------|
| bump / CHANGELOG / tag / push | 本地 `pnpm release:mcp:*` 或 Actions **Release MCP** |
| `pnpm pack` + GitHub Release（`.tgz`） | GitHub Actions |
| `npm publish`（npmjs） | 本地（`npm login` + `--publish`）或 Secret `NPM_TOKEN` |
| GitHub Packages（仓库侧栏） | Actions 用 `GITHUB_TOKEN` 发 `@<owner>/figma-agent-mcp` |

仓库 **Packages** 侧栏展示的是 [GitHub Packages](https://docs.github.com/packages)，不是 npmjs，也不是 GitHub Releases。补发可跑 Actions → **Publish GitHub Packages**。

若配置了 `NPM_TOKEN`，Actions 会尝试发到 npmjs；未配置则跳过，不影响 Release / Packages。

## 一次性 npm 登录

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## 推荐：与插件同版本共发

```bash
pnpm release:kit:patch   # 或 minor / major
```

会 bump **root + mcp + plugin**，推两个 tag，并触发：

- **Release MCP** → npm（若有 `NPM_TOKEN`）+ GitHub Release
- **Release Plugin** → 插件 ZIP GitHub Release

仅发 MCP（易造成版本漂移，不推荐）：

```bash
pnpm release:mcp:patch
```

本地发 npm：

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
```

只改版本不提交：

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## 仅 CI 打包（不 bump / 不 publish）

```bash
gh workflow run pack-mcp.yml
```

产物：`figma-agent-mcp-pack`（`.tgz`）。

## Tag 约定

```text
figma-agent-mcp-v0.1.3
```

## CHANGELOG

[`packages/figma-agent-mcp/CHANGELOG.md`](../../packages/figma-agent-mcp/CHANGELOG.md) 必须保留 `## [Unreleased]`（发版脚本依赖 Keep a Changelog）。

## 相关

- [插件发版](./plugin-release.md)
- [上手指南](./getting-started.md)
