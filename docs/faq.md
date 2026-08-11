# FAQ

**English** | [简体中文](./zh/faq.md)

## Agents / MCP clients

### Which clients are supported?

Any stdio MCP host can run `npx -y figma-agent-mcp`. We document:

**Cursor · Claude Code · Codex · Qoder · CodeBuddy · Trae** — see **[Connect AI agents](./agent-setup.md)** (中文：[接入 AI Agent](./zh/agent-setup.md)).

### My client is configured but tools fail / show Not connected

1. Confirm the Figma plugin bridge is green
2. Confirm the client actually spawned MCP (`npx` / Node on PATH)
3. Follow the client-specific section in [agent-setup.md](./agent-setup.md)
4. See [Bridge / connection](#bridge--connection) below

## Bridge / connection

### `list_files` returns “Not connected” or empty

1. Open the file in **Figma Desktop** and run **Figma Agent Kit**
2. Confirm the plugin bridge indicator is green
3. Ensure only one healthy Leader owns port **1998** (`lsof -iTCP:1998 -sTCP:LISTEN`)
4. Restart Cursor MCP / `npx figma-agent-mcp` after killing orphan Node processes on that port
5. Match versions: plugin ZIP and `figma-agent-mcp` should be the same `0.1.x`

### Port already in use / MCP is always a follower

An old MCP process may still hold `1998`. Stop orphan `node` listeners, then restart the agent MCP so a fresh Leader binds the port. The plugin will reconnect.

### `MsgPack codec not loaded` in the plugin

Rebuild the plugin (`pnpm build`) so the esbuild-injected codec is present in `ui.html` / `code.js`, then **reload** the Development plugin. Do not run an old plugin against a MsgPack-only MCP.

### Local / unsaved files show `fileKey: "unknown"` or `local-…`

Expected for unsaved Desktop files. The plugin stores a stable local key in root `pluginData` when needed. Save the file to Figma cloud when you want a cloud `fileKey`.

## Tools

### Motion tools fail with a capability error

Motion requires a Figma build that exposes `figma.motion` / `applyAnimationStyle`. Update Figma Desktop or skip those tools.

### `apply_animation_style` validation error on `.type`

For built-in presets, pass `animationStyleData: { "type": "FIGMA", … }` (discriminator is `FIGMA` | `USER`), not the fade preset name as `type`.

### Screenshots look huge / agent context overflows

Use `save_screenshots` with `compress: true` (default for PNG) and write to disk. Prefer `get_screenshot` only for small previews. Slice parity: `scale: 3`.

### `getNodeById` / node not found after page switch

The plugin uses `documentAccess: "dynamic-page"` and **`getNodeByIdAsync`**. Use a recent plugin/MCP release with `getNodeByIdAsync` support. Pass correct `fileKey` when multiple files are connected.

## AI (plugin UI)

### Custom LLM host is blocked

Add the host to `manifest.json` → `networkAccess.allowedDomains`, rebuild, re-import. See [AI features](./ai-features.md).

### Does MCP need my OpenAI key?

No. Only the Rename / Group tabs use the key from `clientStorage`.

## Install / versions

### Should MCP and plugin versions match?

**Yes.** Protocol changes (MsgPack, tool shapes) require co-upgrade. Prefer `pnpm release:kit:*` when publishing.

### Where is the npm package vs the plugin ZIP?

| Artifact | Location |
|----------|----------|
| `figma-agent-mcp` | [npmjs.com/package/figma-agent-mcp](https://www.npmjs.com/package/figma-agent-mcp) |
| Plugin ZIP | [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) |
| Scoped GH package | GitHub **Packages** sidebar (`@ChinaCarlos/figma-agent-mcp`) |

## Still stuck?

Open an issue with: OS, Figma Desktop version, MCP version (`npx figma-agent-mcp` / package version), plugin version from the UI, and whether `list_files` / bridge indicator work. See [SECURITY.md](../SECURITY.md) for vulnerability reports (not public issues).
