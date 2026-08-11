# Contributing

Thanks for helping improve **Figma Agent Kit**.

## Development setup

```bash
pnpm install
pnpm build:all
```

| Task | Command |
|------|---------|
| Plugin watch | `pnpm dev` |
| Plugin production build | `pnpm build` |
| MCP watch | `pnpm dev:mcp` |
| MCP build | `pnpm build:mcp` |
| Start MCP | `pnpm start:mcp` |

After plugin changes, **Reload plugin** in Figma Desktop.

## Project layout

```text
packages/
  figma-agent-plugin/   # Figma plugin
  figma-agent-mcp/      # MCP server + bridge
docs/                   # User & protocol docs
```

## Guidelines

1. **No secrets** in commits (tokens, private registries, internal hosts).
2. Prefer small, focused PRs.
3. Keep bridge tool names stable when possible (agents depend on them).
4. Use `console.error` for MCP server logs (stdout is reserved for MCP stdio).
5. Document new tools in `docs/tools.md`.

## Pull requests

1. Fork / branch from `main`
2. Make changes + build locally
3. Open a PR with a short summary and test notes

## Code of conduct

Be respectful. Assume good intent. Harassment is not allowed.
