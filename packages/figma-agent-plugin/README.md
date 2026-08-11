# Figma Agent Kit (plugin)

Figma Desktop plugin for [figma-agent-kit](https://github.com/ChinaCarlos/figma-agent-kit): local MCP bridge client, optional AI rename/group, and 3× slice export.

Distributed as a **ZIP** on [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) (not npm). Keep the version aligned with [`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp).

## Install (release ZIP)

1. Download `figma-agent-plugin-vX.Y.Z.zip`
2. Unzip
3. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
4. Select `manifest.json`
5. Run **Figma Agent Kit** and start MCP (`npx -y figma-agent-mcp`)

## Develop from the monorepo

```bash
# from repo root
pnpm install
pnpm --filter figma-agent-plugin build
# Import packages/figma-agent-plugin/manifest.json
pnpm --filter figma-agent-plugin dev   # watch
```

Bridge port is synced from root `bridge.config.json` via `pnpm sync:bridge`.

## Features

| Area | Docs |
|------|------|
| MCP bridge (MsgPack WS) | [Bridge protocol](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/bridge-protocol.md) |
| AI rename / group | [AI features](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/ai-features.md) |
| Slice export | [Exporting slices](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/exporting-slices.md) |
| Getting started | [Getting started](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/getting-started.md) |

## License

MIT (see repository root `LICENSE`)
