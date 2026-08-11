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

Leave it running. The server listens on `localhost:1998` for plugin WebSockets and speaks MCP over stdio to your agent client.

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

## AI rename & grouping (optional)

1. Open **Settings** and configure an OpenAI-compatible API (`apiBaseUrl`, `model`, `apiKey`).
2. Use the **Rename** or **Group** tabs in the plugin panel.

See [ai-features.md](./ai-features.md) for details, custom providers, and manifest domain notes.

## Changing the bridge port

Default port is defined once in **`bridge.config.json`** at the repo root.

```json
{ "defaultPort": 1998 }
```

Then:

```bash
pnpm sync:bridge   # or any pnpm build / build:all
pnpm build:all
```

Rebuild updates MCP default, plugin `constants` / UI, and `manifest.json` `networkAccess` together. Reload the plugin in Figma after building.

Optional runtime override for the MCP process only: `FIGMA_AGENT_MCP_PORT` (must still match the port baked into the plugin + manifest).

## Mini mode

Use the Mini toggle in the plugin header to shrink the panel to bridge + selection only. Useful while chatting with an agent.

## Publishing a new version

Version checks use a file in **this GitHub repo** — no CDN:

1. Bump `version` in `packages/figma-agent-plugin/package.json` (and root `package.json` if you keep them in sync).
2. Update `releases/version.json`:
   - `latest` — semver string
   - `releasedAt` — date
   - `notes` — bullet list for the update modal
   - `downloadUrl` — zip or release asset URL
3. Commit and push to `main`.
4. The plugin fetches `https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/releases/version.json?_t=…` on startup.

Users with an older build see a red dot on Settings and an update modal (unless they dismiss that version).

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Always disconnected | Is `pnpm start:mcp` running? Is the port free? Reload plugin after upgrades (MsgPack + port must match) |
| `list_files` empty | Plugin must be running on an open file; check fileKey in panel logs |
| Permission / network errors | Change port via `bridge.config.json` + rebuild (manifest whitelist is synced automatically) |
| AI API fails | Check API key; for non-OpenAI hosts add domain to `manifest.json` and rebuild |
| Unsaved file warning | Save the Figma file; unsaved documents may use a temporary key |

More detail: [bridge-protocol.md](./bridge-protocol.md), [tools.md](./tools.md), [ai-features.md](./ai-features.md).
