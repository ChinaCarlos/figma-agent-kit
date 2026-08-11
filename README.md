# Figma Agent Kit

Open-source toolkit that connects **Figma** to AI agents (Cursor, Claude Code, Codex, and other MCP clients) through a local bridge.

```text
AI Agent  ──stdio MCP──►  figma-agent-mcp  ──WebSocket──►  Figma Agent Kit plugin
                              :1998                         (Figma Desktop)
```

## Packages

| Package | Path | Role |
|---------|------|------|
| **figma-agent-plugin** | `packages/figma-agent-plugin` | Figma plugin UI + Plugin API handlers |
| **figma-agent-mcp** | `packages/figma-agent-mcp` | MCP server (stdio) + localhost bridge |

## Features (v0.1)

- Local **MCP Bridge** so agents can read/write the open Figma file
- **MessagePack** binary framing on WebSocket + leader/follower RPC (PNG as `bin`, no base64 on the wire)
- Multi-file support via `fileKey` (leader/follower when multiple MCP processes start)
- Plugin panel: bridge status, selection sync, settings storage, Mini mode
- Core tools: document/selection/node/screenshot, text/fill/stroke/effects/auto-layout edits, create frame/text/shape/image, group/delete, selection & zoom
- **AI layer rename** — semantic names on a clone via OpenAI-compatible vision API
- **AI visual grouping** — nested group plan on a clone, editable JSON before apply
- **GitHub version checks** — `releases/version.json` on `main` (no CDN)
- **No** cloud upload, **no** vendor lock-in for AI keys in the bridge path

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

Default bridge port: from [`bridge.config.json`](./bridge.config.json) (synced into MCP, plugin UI, and `manifest.json` on build). Optional MCP override: `FIGMA_AGENT_MCP_PORT`.

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

### 4. AI features (optional)

Open **Settings** in the plugin, set `apiBaseUrl` / `model` / `apiKey`, then use **Rename** or **Group** tabs. See [docs/ai-features.md](docs/ai-features.md).

## Documentation

| Doc | Content |
|-----|---------|
| [docs/getting-started.md](docs/getting-started.md) | Install, import, MCP, version publishing |
| [docs/ai-features.md](docs/ai-features.md) | AI rename/group setup |
| [docs/bridge-protocol.md](docs/bridge-protocol.md) | WebSocket / RPC contract |
| [docs/tools.md](docs/tools.md) | MCP tool reference |
| [docs/mcp-release.md](docs/mcp-release.md) | npm for `figma-agent-mcp` |
| [docs/plugin-release.md](docs/plugin-release.md) | Plugin ZIP on GitHub Releases |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## Security & privacy

- Bridge traffic stays on **localhost**
- Do not commit API keys or `.env` files
- Plugin `networkAccess` allows the local MCP bridge, GitHub version checks, and common OpenAI-compatible LLM hosts (OpenAI / DashScope / DeepSeek / Moonshot / …)
- Unlisted AI API hosts still need editing `manifest.json` → `allowedDomains` and rebuilding
- API credentials are stored in Figma `clientStorage` for plugin AI features only

## License

[MIT](LICENSE)

## Acknowledgments

The local bridge pattern (plugin ↔ MCP over WebSocket) is a common approach in the Figma + MCP ecosystem. This repository is an independent clean-room implementation for **Figma Agent Kit**.
