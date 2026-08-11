# Releasing figma-agent-mcp

**English** | [简体中文](./zh/mcp-release.md)

Public npm package: [`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

## Responsibilities

| Step | Where |
|------|--------|
| Bump / CHANGELOG / tag / push | Local `pnpm release:mcp:*` or Actions **Release MCP** |
| `pnpm pack` + GitHub Release (`.tgz`) | GitHub Actions |
| `npm publish` (npmjs) | Local (`npm login` + `--publish`) or Secret `NPM_TOKEN` |
| GitHub Packages (repo sidebar) | Actions publishes `@<owner>/figma-agent-mcp` with `GITHUB_TOKEN` |

The repository **Packages** sidebar shows [GitHub Packages](https://docs.github.com/packages) (`npm.pkg.github.com`), not npmjs and not GitHub Releases. Re-run Actions → **Publish GitHub Packages** to backfill.

If `NPM_TOKEN` is set, Actions also tries `npm publish` to npmjs; if unset, npmjs publish is skipped without failing GitHub Release / Packages.

## One-time npm login

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## Recommended: co-release with the plugin

Keep MCP and plugin versions aligned:

```bash
pnpm release:kit:patch   # or minor / major
```

This bumps **root + mcp + plugin**, pushes two tags, and triggers:

- **Release MCP** → npm (if `NPM_TOKEN`) + GitHub Release
- **Release Plugin** → plugin ZIP GitHub Release

MCP-only (can drift versions — not recommended):

```bash
pnpm release:mcp:patch
```

Publish to npm locally:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
# or after tagging:
cd packages/figma-agent-mcp && npm publish --access public --registry https://registry.npmjs.org/
```

Bump without git:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## CI pack only (no bump / no publish)

```bash
gh workflow run pack-mcp.yml
```

Artifact: `figma-agent-mcp-pack` (`.tgz`).

## Tag convention

```text
figma-agent-mcp-v0.1.3
```

## CHANGELOG

[`packages/figma-agent-mcp/CHANGELOG.md`](../packages/figma-agent-mcp/CHANGELOG.md) must keep a `## [Unreleased]` section — the release script requires it (Keep a Changelog).

## Related

- [Plugin release](./plugin-release.md)
- [Getting started](./getting-started.md)
