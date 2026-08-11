# Connect AI agents (MCP clients)

**English** | [简体中文](./zh/agent-setup.md)

How to register **`figma-agent-mcp`** in popular MCP clients. Install the [Figma plugin](./getting-started.md) first and keep the bridge green before testing tools.

## Shared prerequisites

1. **Node.js ≥ 20** on your PATH (`node -v`, `npx -v`)
2. Figma Desktop + **Figma Agent Kit** plugin running (MCP Bridge connected)
3. Prefer unpinned `npx -y figma-agent-mcp` (always latest); pin with `@x.y.z` only for frozen installs
4. Optional custom bridge port (must match the plugin):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

### Common stdio snippet (JSON clients)

Most editors accept this shape under `mcpServers`:

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

### Smoke test (any client)

With a frame selected in Figma, ask the agent to:

1. `list_files`
2. `get_selection`
3. `get_node` / `get_screenshot`

You should see **37 tools** once the MCP process is healthy.

---

## Cursor

**Docs / UI:** Cursor Settings → **MCP** (or edit JSON directly).

| Scope | Path |
|-------|------|
| User | `~/.cursor/mcp.json` |
| Project | `.cursor/mcp.json` |

Paste the [common JSON snippet](#common-stdio-snippet-json-clients), save, then restart / refresh MCP.

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

Verify in Cursor’s MCP list: **figma-agent-mcp** · **37 tools enabled**.

![Cursor MCP tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

---

## Claude Code

**Official guide:** [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)

### CLI (recommended)

```bash
# User scope — available in all projects
claude mcp add --scope user figma-agent-mcp -- npx -y figma-agent-mcp

# Or project scope — writes .mcp.json (share with the team)
claude mcp add --scope project figma-agent-mcp -- npx -y figma-agent-mcp
```

Custom port:

```bash
claude mcp add --scope user figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp
```

### Config files

| Scope | File |
|-------|------|
| User | `~/.claude.json` → top-level `mcpServers` |
| Project | `.mcp.json` in the repo root |
| Local | `~/.claude.json` under the project entry (CLI default) |

Example `.mcp.json`:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "figma-agent-mcp"]
    }
  }
}
```

Restart Claude Code, then run `/mcp` to confirm the server is connected. Approve project `.mcp.json` servers on first use if prompted.

---

## Codex (OpenAI)

**Official guide:** [Codex MCP](https://developers.openai.com/codex/mcp)

Codex uses **TOML** (`~/.codex/config.toml`, or project `.codex/config.toml` for trusted projects). ChatGPT desktop / Codex CLI / IDE extension share this config.

### CLI

```bash
codex mcp add figma-agent-mcp -- npx -y figma-agent-mcp

# With custom port
codex mcp add figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp

codex mcp list
```

### `config.toml`

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]
```

With env:

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]

[mcp_servers.figma-agent-mcp.env]
FIGMA_AGENT_MCP_PORT = "1998"
```

Restart Codex / the IDE extension after editing.

---

## Qoder

**Official guide:** [Qoder MCP](https://docs.qoder.com/user-guide/chat/model-context-protocol)

1. Open **Qoder Settings** (avatar, or `⌘⇧,` / `Ctrl+Shift+,`)
2. Left nav → **MCP**
3. **My Servers** → **+ Add**
4. Paste the [common JSON snippet](#common-stdio-snippet-json-clients) (STDIO: command `npx`, args as above)
5. Save — a link icon means connected; expand to see tools

Use **Agent mode** in Chat so the model can call MCP tools (confirm prompts as needed).

Alternatively browse **MCP Square** if the server appears there; for this package, manual STDIO add is the reliable path.

---

## CodeBuddy

**Official guide:** [CodeBuddy Config MCP](https://www.codebuddy.ai/docs/ide/User-guide/MCP)

1. Sidebar chat → **CodeBuddy Settings** (top-right)
2. Open the **MCP** tab
3. **Add MCP** (or install from **MCP Market** if listed)
4. Paste JSON, for example:

```json
{
  "mcpServers": {
    "figma-agent-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "figma-agent-mcp"],
      "description": "Local Figma Desktop bridge (Figma Agent Kit)"
    }
  }
}
```

5. Confirm green status; optional **Try to Run**, then use **Craft Agent** with Figma open

---

## Trae

**Official guide:** [Trae — Add MCP servers](https://docs.trae.ai/ide/add-mcp-servers) · [中文](https://docs.trae.cn/ide_add-mcp-servers)

### UI (global)

1. Settings → **MCP**
2. **Add → Add Manually** (or marketplace if available)
3. Paste the [common JSON snippet](#common-stdio-snippet-json-clients) and confirm

You can also open **Raw Config (JSON)** and merge into Trae’s `mcp.json`.

### Project-level

1. Create `.trae/mcp.json` in the project root with the same `mcpServers` JSON
2. In Settings → **MCP**, enable **project-level MCP** if your Trae build exposes that toggle

SOLO / Work mode: if tools are flaky, prefer project-level config and explicitly ask the agent to use `figma-agent-mcp` / `list_files`.

---

## Local build instead of npx

Point any JSON client at a built binary:

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

Codex TOML:

```toml
[mcp_servers.figma-agent-mcp]
command = "node"
args = ["/ABS/PATH/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
```

See [Getting started — from source](./getting-started.md#path-b--develop-from-source).

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Client shows 0 tools / failed | Node/`npx` on PATH; restart client |
| Tools OK but `Not connected` | Plugin running + green bridge; single Leader on port 1998 |
| Wrong port | Align `FIGMA_AGENT_MCP_PORT` with plugin / `bridge.config.json` |
| Multiple agents | Expected — Leader/Follower election; only one binds the port |

More: [FAQ](./faq.md).
