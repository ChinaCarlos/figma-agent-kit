# Getting started

**English** | [简体中文](./zh/getting-started.md)

Connect **Figma Desktop** to an AI agent (Cursor, Claude Code, Codex, …) via the local MCP bridge.

## Requirements

- [Figma Desktop](https://www.figma.com/downloads/) (recommended; browser tabs may sleep and drop WebSockets)
- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9** (for building from source)
- An MCP-capable agent (Cursor / Claude / Codex / …)

## Path A — published packages (fastest)

### 1. Install the plugin

1. Open the [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) page
2. Download `figma-agent-plugin-vX.Y.Z.zip` (match the MCP version you will run)
3. Unzip
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. Select the unzipped `manifest.json`
6. Run **Plugins → Development → Figma Agent Kit**

Confirm the bridge status indicator is green (or reconnects) once MCP is running:

![Plugin open in Figma with MCP Bridge connected](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

Use the header **minimize** control for a compact selection-only window:

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

Gear menu (language, model, prompts, updates):

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

### 2. Configure the MCP server

**Cursor** — `~/.cursor/mcp.json` or project `.cursor/mcp.json`:

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

Pin a version if you want:

```json
"args": ["-y", "figma-agent-mcp@0.1.3"]
```

![Cursor mcp.json with pinned figma-agent-mcp@0.1.3](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

Custom port (must match the plugin build):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

Restart the agent / MCP servers after editing. In Cursor’s MCP panel you should see **37 tools enabled**:

![Cursor shows figma-agent-mcp with 37 tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

### 3. Smoke test

Ask the agent to:

1. `list_files` — should show your open file
2. `get_selection` — select a frame first
3. `get_node` / `get_screenshot` — verify read path
4. Optionally `save_screenshots` with `scale: 3`, `compress: true`

## Path B — develop from source

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

Import the plugin from:

```text
packages/figma-agent-plugin/manifest.json
```

Start MCP manually (optional while iterating):

```bash
pnpm start:mcp
```

Or point Cursor at the built binary:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "command": "node",
      "args": ["/ABS/PATH/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
    }
  }
}
```

Watch mode:

```bash
pnpm dev          # plugin
pnpm dev:mcp      # MCP TypeScript watch
```

After UI/bridge changes: **reload the plugin** in Figma and restart MCP clients.

## Port sync

Default bridge port is **1998** from [`bridge.config.json`](../bridge.config.json).

```bash
pnpm sync:bridge   # also runs on predev / prebuild
```

If you change the port: sync → rebuild plugin → re-import / reload → restart MCP with matching `FIGMA_AGENT_MCP_PORT`.

## Optional: in-plugin AI

Rename and visual grouping need an OpenAI-compatible API key in the plugin settings. See [AI features](./ai-features.md).  
MCP bridge tools do **not** require that key.

## Slice export (plugin UI)

See [Exporting slices](./exporting-slices.md) for 1× preview / 3× PNG + ZIP from the plugin panel.

## Next steps

| Topic | Doc |
|-------|-----|
| Screenshot gallery | [screenshots.md](./screenshots.md) |
| Architecture & diagrams | [architecture.md](./architecture.md) |
| Wire protocol | [bridge-protocol.md](./bridge-protocol.md) |
| All 37 tools | [tools.md](./tools.md) |
| Troubleshooting | [faq.md](./faq.md) |
| Releasing | [mcp-release.md](./mcp-release.md), [plugin-release.md](./plugin-release.md) |
