# figma-agent-plugin

Figma Agent Kit plugin — connects Figma Desktop to a local MCP bridge so AI agents can read and modify the current file.

## Prerequisites

- [Figma Desktop](https://www.figma.com/downloads/)
- Node.js 20+ and [pnpm](https://pnpm.io/)
- [`figma-agent-mcp`](../figma-agent-mcp) running locally (WebSocket on port `1998`)

## Build

From the monorepo root:

```bash
pnpm install
pnpm --filter figma-agent-plugin build
```

Development watch mode:

```bash
pnpm --filter figma-agent-plugin dev
```

Output: `dist/code.js`

## Import in Figma

1. Open **Figma Desktop** → **Plugins** → **Development** → **Import plugin from manifest…**
2. Select `packages/figma-agent-plugin/manifest.json`
3. Run **Figma Agent Kit** from **Plugins** → **Development**

## Usage

1. Start the MCP bridge: `pnpm --filter figma-agent-mcp start` (from repo root)
2. Open a Figma file and run the plugin
3. Configure your agent to use the `figma-agent-mcp` MCP server
4. The plugin UI shows bridge status and current selection

**Mini mode** collapses the panel to a compact header. **Settings** stores OpenAI-compatible API credentials for **Rename** and **Group** tabs. **Version checks** pull from `releases/version.json` on GitHub.

## Architecture

```
AI Agent  ←→  figma-agent-mcp (stdio MCP + WS :1998)  ←→  Plugin UI  ←→  Plugin main (Figma API)
```

See the [figma-agent-kit](https://github.com/ChinaCarlos/figma-agent-kit) monorepo README for full documentation.

## License

MIT
