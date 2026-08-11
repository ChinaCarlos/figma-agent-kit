# figma-agent-mcp 发版指南

公开 npm 包：[`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

推荐分工：

| 步骤 | 在哪做 |
|------|--------|
| bump / CHANGELOG / tag / push | 本地 `pnpm release:mcp:*` 或 Actions **Release MCP** |
| `pnpm pack` + GitHub Release（附 `.tgz`） | GitHub Actions |
| `npm publish` | **本地**（`npm login` + `--publish`），不必把 `NPM_TOKEN` 存进 GitHub |

若仓库配置了可选 Secret `NPM_TOKEN`，Actions 也会尝试 `npm publish`；未配置则跳过，不影响打包与 Release。

## 一次性准备（本地 npm）

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## 日常发版

工作区干净时，在 monorepo 根目录：

```bash
# 预览
cd packages/figma-agent-mcp && node scripts/release.mjs patch --dry-run

# bump → build → commit → tag figma-agent-mcp-vX.Y.Z → push
# → CI：pack + GitHub Release（无 NPM_TOKEN 时不发 npm）
pnpm release:mcp:patch
pnpm release:mcp:minor
pnpm release:mcp:major
```

本地一并发布到 npm：

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
# 或发版后：
cd packages/figma-agent-mcp && npm publish --access public --registry https://registry.npmjs.org/
```

只改版本文件、不提交：

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## 测试 CI 打包（不 bump、不发 npm）

Actions → **Pack MCP** → Run workflow  

或：

```bash
gh workflow run pack-mcp.yml
```

成功后可在该次 run 的 Artifacts 下载 `figma-agent-mcp-pack`（`.tgz`）。

## 从 GitHub Actions 完整发版

Actions → **Release MCP** → 选择 `patch|minor|major`。  

同一 job：bump、推送 tag、pack、创建 Release；有 `NPM_TOKEN` 才 publish。

## Tag 约定

```text
figma-agent-mcp-v0.1.1
```

## 发布后客户端配置

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "command": "npx",
      "args": ["-y", "figma-agent-mcp"]
    }
  }
}
```

## 相关文件

| 路径 | 说明 |
|------|------|
| `packages/figma-agent-mcp/scripts/release.mjs` | 发版脚手架 |
| `packages/figma-agent-mcp/CHANGELOG.md` | Keep a Changelog |
| `.github/workflows/release-mcp.yml` | tag / dispatch 发版 |
| `.github/workflows/pack-mcp.yml` | 仅验证 pack |
| `releases/version.json` | **插件**版本检查（与 MCP npm 独立） |
