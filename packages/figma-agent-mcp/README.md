# figma-agent-mcp

[![npm](https://img.shields.io/npm/v/figma-agent-mcp.svg)](https://www.npmjs.com/package/figma-agent-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Local **Model Context Protocol** server that bridges AI agents to the **Figma Agent Kit** Desktop plugin over `localhost` (MessagePack WebSocket + Leader/Follower election).

This package is part of the [figma-agent-kit](https://github.com/ChinaCarlos/figma-agent-kit) monorepo. Full docs: [Getting started](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/getting-started.md) · [Screenshots](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/screenshots.md) · [Tools](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/tools.md) · [Architecture](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/architecture.md).

## Install / run

```bash
npx -y figma-agent-mcp
```

Or pin a version: `npx -y figma-agent-mcp@0.1.3`

### Cursor (`~/.cursor/mcp.json`)

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

Optional port (must match the plugin):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

## Requirements

- Node.js ≥ 18 (monorepo recommends ≥ 20)
- [Figma Agent Kit plugin](https://github.com/ChinaCarlos/figma-agent-kit/releases) running in Figma Desktop on the **same version**

## Tools

37 tools: read/write canvas, screenshots (`save_screenshots` with TinyPNG-style PNG compression), Motion beta. See the [tool catalog](https://github.com/ChinaCarlos/figma-agent-kit/blob/main/docs/tools.md).

## License

MIT
