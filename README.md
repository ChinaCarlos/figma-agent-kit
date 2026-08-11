# Figma Agent Kit

Open-source toolkit that connects **Figma** to AI agents (Cursor, Claude Code, Codex, and other MCP clients) through a local bridge.

```text
AI Agent  ──stdio MCP──►  figma-agent-mcp  ──WebSocket──►  Figma Agent Kit plugin
                              :1994                         (Figma Desktop)
```

## Packages

| Package | Path | Role |
|---------|------|------|
| **figma-agent-plugin** | `packages/figma-agent-plugin` | Figma plugin UI + Plugin API handlers |
| **figma-agent-mcp** | `packages/figma-agent-mcp` | MCP server (stdio) + localhost bridge |

## Features (v0.1)

- Local **MCP Bridge** so agents can read/write the open Figma file
- Multi-file support via `fileKey` (leader/follower when multiple MCP processes start)
- Plugin panel: bridge status, selection sync, settings storage, Mini mode
- Core tools: document/selection/node/screenshot, text & visibility edits, create/group/delete, selection & zoom
- **No** cloud upload, **no** vendor lock-in for AI keys in the bridge path

> Layer rename / visual grouping AI workflows can be added later as optional plugin features. v0.1 focuses on a solid Agent ↔ Figma bridge.

## Requirements

- Node.js ≥ 20
- pnpm ≥ 9
- [Figma Desktop](https://www.figma.com/downloads/) (Development plugin import)

## Quick start

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

### 1. Load the plugin

1. Open **Figma Desktop**
2. **Plugins → Development → Import plugin from manifest…**
3. Select `packages/figma-agent-plugin/manifest.json`
4. Run **Figma Agent Kit**

### 2. Run the MCP server

```bash
pnpm start:mcp
# or: pnpm --filter figma-agent-mcp start
```

Default bridge port: `1994` (override with `FIGMA_AGENT_MCP_PORT`).

### 3. Connect an agent (Cursor example)

Add to your MCP config (e.g. Cursor `mcp.json`):

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

For local development without publishing:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "command": "node",
      "args": ["/ABS/PATH/TO/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
    }
  }
}
```

Keep the Figma file open with the plugin running, then ask the agent to call `list_files` / `get_selection` / `get_node`, etc.

## Documentation

| Doc | Content |
|-----|---------|
| [docs/getting-started.md](docs/getting-started.md) | Install, Import, first tool call |
| [docs/bridge-protocol.md](docs/bridge-protocol.md) | WebSocket / RPC contract |
| [docs/tools.md](docs/tools.md) | MCP tool reference |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## Security & privacy

- Bridge traffic stays on **localhost**
- Do not commit API keys or `.env` files
- Plugin `networkAccess` only allows `ws://localhost:1994` by default
- Optional API base URL / key in settings are stored in Figma `clientStorage` for future AI features; the bridge itself does not require them

## License

[MIT](LICENSE)

## Acknowledgments

The local bridge pattern (plugin ↔ MCP over WebSocket) is a common approach in the Figma + MCP ecosystem. This repository is an independent clean-room implementation for **Figma Agent Kit**.
