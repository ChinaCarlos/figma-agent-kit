# figma-agent-mcp

MCP server that bridges AI agents (Cursor, Claude Desktop, etc.) to Figma via a companion plugin WebSocket bridge.

## Prerequisites

- Node.js 18+
- A Figma plugin that connects to this server's WebSocket endpoint (`/ws?fileKey=...&fileName=...`)

## Install

```bash
npm install figma-agent-mcp
# or
pnpm add figma-agent-mcp
```

## Cursor configuration

Add to your Cursor MCP settings (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

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

### Custom port

Default port is **1998**. Override with the `FIGMA_AGENT_MCP_PORT` environment variable:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "command": "npx",
      "args": ["-y", "figma-agent-mcp"],
      "env": {
        "FIGMA_AGENT_MCP_PORT": "1998"
      }
    }
  }
}
```

## How it works

1. **MCP process** — speaks stdio MCP to your agent and runs an internal HTTP/WebSocket server on the configured port.
2. **Leader election** — if multiple MCP instances start, one becomes leader (holds the WebSocket bridge); others forward RPC to the leader.
3. **Figma plugin** — connects via WebSocket to `ws://localhost:PORT/ws?fileKey=KEY&fileName=NAME`.
4. **Tools** — MCP tools forward requests to the plugin through the bridge.

## Available tools

### MCP-local

| Tool | Description |
|------|-------------|
| `list_files` | List connected Figma files |
| `save_screenshots` | Export to disk; PNG TinyPNG-style compression by default; use `scale: 3` for slices |

### Bridge-forwarded (require plugin)

Read: `get_document`, `get_selection`, `get_node`, `get_styles`, `get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`

Write: `set_node_visibility`, `set_text_content`, `set_text_properties`, `set_node_properties`, `set_solid_fill`, `set_gradient_fill`, `set_effects`, `set_stroke_properties`, `set_auto_layout`, `create_frame`, `create_text`, `create_shape`, `create_image`, `duplicate_nodes`, `reparent_nodes`, `group_nodes`, `ungroup_node`, `set_selection`, `scroll_and_zoom_into_view`, `delete_nodes`

Motion (Figma Motion API beta): `get_motion_styles`, `get_node_motion`, `apply_animation_style`, `remove_animation_style`, `apply_manual_keyframe_track`, `remove_manual_keyframe_track`, `set_timeline_duration`

Full list: [docs/tools.md](../../docs/tools.md) (37 tools).

## Release

From the monorepo root (see [docs/mcp-release.md](../../docs/mcp-release.md)):

```bash
pnpm release:mcp:patch   # bump → tag → CI publishes npm + GitHub Release
```

## Development

```bash
pnpm install
pnpm build
pnpm start
```

## License

MIT
