# Contributing

Thanks for helping improve **Figma Agent Kit**.

## Development setup

```bash
pnpm install
pnpm build:all
```

| Task | Command |
|------|---------|
| Sync bridge port | `pnpm sync:bridge` |
| Plugin watch | `pnpm dev` |
| Plugin production build | `pnpm build` |
| MCP watch | `pnpm dev:mcp` |
| MCP build | `pnpm build:mcp` |
| Start MCP | `pnpm start:mcp` |
| Release MCP (patch/minor/major) | `pnpm release:mcp:patch` 等 |

After plugin changes, **Reload plugin** in Figma Desktop.

## Bridge port (single source of truth)

Edit **`/bridge.config.json`** → `defaultPort`, then run any build (`pnpm build:all` / `pnpm sync:bridge`).

That syncs:

- `packages/figma-agent-mcp/src/default-port.ts`
- `packages/figma-agent-plugin/src/shared/bridge-port.generated.ts` (exported as `BRIDGE_PORT` from `constants.ts`)
- `packages/figma-agent-plugin/manifest.json` (`ws://localhost:<port>`)
- Plugin UI (`__BRIDGE_PORT__` injected into `ui.html` at rsbuild time)

Do **not** hand-edit those generated files or hardcode `1998` in the UI.

## Project layout

```text
bridge.config.json      # default MCP / plugin bridge port
packages/
  figma-agent-plugin/   # Figma plugin
  figma-agent-mcp/      # MCP server + bridge
docs/                   # User & protocol docs
scripts/                # sync-bridge-config.mjs, …
```

## Guidelines

1. **No secrets** in commits (tokens, private registries, internal hosts).
2. Prefer small, focused PRs.
3. Keep bridge tool names stable when possible (agents depend on them).
4. Use `console.error` for MCP server logs (stdout is reserved for MCP stdio).
5. Document new tools in `docs/tools.md`.
6. Change the bridge port only via `bridge.config.json`.

## Pull requests

1. Fork / branch from `main`
2. Make changes + build locally
3. Open a PR with a short summary and test notes

## Code of conduct

Be respectful. Assume good intent. Harassment is not allowed.
