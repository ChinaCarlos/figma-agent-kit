# Getting started

## Install

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

## Import the plugin (Figma Desktop)

1. Open a Figma design file in **Desktop** (not only the browser, for Development import).
2. Menu: **Plugins → Development → Import plugin from manifest…**
3. Choose:

```text
packages/figma-agent-plugin/manifest.json
```

4. Run **Figma Agent Kit** from Development plugins.

You should see bridge status in the panel (connecting / connected / disconnected).

## Start MCP

In a terminal:

```bash
pnpm start:mcp
```

Leave it running. The server listens on `localhost:1994` for plugin WebSockets and speaks MCP over stdio to your agent client.

## Configure Cursor / Claude / Codex

Point the MCP client at the built server, for example:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
    }
  }
}
```

After publishing `figma-agent-mcp` to npm, you can use `npx -y figma-agent-mcp` instead.

## First checks

With the plugin **connected** and a file open:

1. Agent: call `list_files` → should list the open file  
2. Select a frame in Figma  
3. Agent: call `get_selection` → should return the selection  
4. Agent: call `get_node` with a node id → should return serialized node data  

If `list_files` is empty, reload the plugin and confirm the status dot is green/connected.

## Mini mode

Use the Mini toggle in the plugin header to shrink the panel to bridge + selection only. Useful while chatting with an agent.

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Always disconnected | Is `pnpm start:mcp` running? Is port 1994 free? |
| `list_files` empty | Plugin must be running on an open file; check fileKey in panel logs |
| Permission / network errors | Ensure `manifest.json` allows `ws://localhost:1994` and you rebuilt after edits |
| Unsaved file warning | Save the Figma file; unsaved documents may use a temporary key |

More detail: [bridge-protocol.md](./bridge-protocol.md), [tools.md](./tools.md).
