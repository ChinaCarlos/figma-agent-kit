# Contributing

Thanks for helping improve **Figma Agent Kit**.

## Development setup

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

Requirements: Node.js ≥ 20, pnpm ≥ 9, Figma Desktop.

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Plugin watch build |
| `pnpm dev:mcp` | MCP TypeScript watch |
| `pnpm build:all` | Production build both packages |
| `pnpm start:mcp` | Run built MCP on the bridge port |
| `pnpm sync:bridge` | Sync `bridge.config.json` → MCP + plugin + manifest |
| `pnpm dev:docs` | Rspress docs site (syncs `docs/` → `docs-site/`) |
| `pnpm build:docs` | Build docs for GitHub Pages |

Import the plugin from `packages/figma-agent-plugin/manifest.json` (Development). Reload after UI/bridge changes.

## Bridge port

Single source of truth: [`bridge.config.json`](./bridge.config.json).

Do **not** hand-edit generated files such as:

- `packages/figma-agent-mcp/src/default-port.ts`
- `packages/figma-agent-plugin/src/shared/bridge-port.generated.ts`
- baked `ws://localhost:…` in `manifest.json` (written by sync)

Change `defaultPort` → `pnpm sync:bridge` → rebuild → reload plugin → restart MCP.

## Project layout

```text
packages/figma-agent-mcp/     # MCP + bridge server
packages/figma-agent-plugin/  # Figma plugin
docs/                         # Source docs (English) + docs/zh/ (Chinese)
docs-site/                    # Rspress site → GitHub Pages
scripts/                      # sync-bridge, sync-docs-site, release-kit
```

Read [docs/architecture.md](./docs/architecture.md) (or [中文](./docs/zh/architecture.md)) before large changes.

Docs are bilingual: homepage **`README.md` is Chinese** by default; English landing page is `README.en.md`. Detailed docs live under `docs/zh/` (Chinese) and `docs/` (English). The published site is [chinacarlos.github.io/figma-agent-kit](https://chinacarlos.github.io/figma-agent-kit/) (`pnpm sync:docs` copies Markdown into `docs-site/` before build). Prefer GitHub raw URLs for screenshots in source Markdown (`https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/...`).

## Pull requests

1. Open an issue for large features / breaking protocol changes when possible
2. Keep PRs focused; update docs when behavior changes
3. Ensure `pnpm build:all` passes
4. Follow the [Code of Conduct](./CODE_OF_CONDUCT.md)
5. Do not commit secrets, `.env`, or `releases/*.zip`

## Releases

Maintainers: see [docs/mcp-release.md](./docs/mcp-release.md) and [docs/plugin-release.md](./docs/plugin-release.md). Prefer `pnpm release:kit:*` so MCP and plugin stay version-aligned.

## Questions

Use GitHub Discussions/Issues for product questions. Security issues: [SECURITY.md](./SECURITY.md).
