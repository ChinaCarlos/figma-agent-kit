# 接入 AI Agent（MCP 客户端）

[English](../agent-setup.md) | **简体中文**

如何在主流 MCP 客户端中注册 **`figma-agent-mcp`**。请先完成 [插件安装](./getting-started.md)，并确认桥状态为绿色后再测工具。

## 共用前置条件

1. 本机 **Node.js ≥ 20**（`node -v`、`npx -v`）
2. Figma Desktop + **Figma Agent Kit** 插件已运行（MCP Bridge 已连接）
3. 推荐使用未锁定的 `npx -y figma-agent-mcp`（始终拉最新）；仅在需要复现时再加 `@x.y.z`
4. 可选自定义桥端口（须与插件一致）：

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

### 通用 STDIO 配置片段（JSON 类客户端）

多数编辑器在 `mcpServers` 下使用：

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

### 冒烟测试（任意客户端）

在 Figma 选中 Frame 后，让 Agent：

1. `list_files`
2. `get_selection`
3. `get_node` / `get_screenshot`

MCP 正常时一般可见 **37 个工具**。

---

## Cursor

**入口：** Cursor Settings → **MCP**（或直接改 JSON）。

| 范围 | 路径 |
|------|------|
| 用户级 | `~/.cursor/mcp.json` |
| 项目级 | `.cursor/mcp.json` |

粘贴[通用 JSON 片段](#通用-stdio-配置片段json-类客户端)，保存后重启 / 刷新 MCP。

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

在 MCP 列表确认：**figma-agent-mcp** · **37 tools enabled**。

![Cursor MCP 工具](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

---

## Claude Code

**官方文档：** [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)

### CLI（推荐）

```bash
# 用户级 — 所有项目可用
claude mcp add --scope user figma-agent-mcp -- npx -y figma-agent-mcp

# 项目级 — 写入 .mcp.json（可提交给团队）
claude mcp add --scope project figma-agent-mcp -- npx -y figma-agent-mcp
```

自定义端口：

```bash
claude mcp add --scope user figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp
```

### 配置文件

| 范围 | 文件 |
|------|------|
| 用户级 | `~/.claude.json` 顶层 `mcpServers` |
| 项目级 | 仓库根目录 `.mcp.json` |
| 本地级 | `~/.claude.json` 中对应项目条目（CLI 默认） |

`.mcp.json` 示例：

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

重启 Claude Code，用 `/mcp` 确认已连接；首次加载项目 `.mcp.json` 时按提示批准。

---

## Codex（OpenAI）

**官方文档：** [Codex MCP](https://developers.openai.com/codex/mcp)

Codex 使用 **TOML**（`~/.codex/config.toml`，受信项目也可用 `.codex/config.toml`）。ChatGPT 桌面端 / Codex CLI / IDE 扩展共用该配置。

### CLI

```bash
codex mcp add figma-agent-mcp -- npx -y figma-agent-mcp

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

带环境变量：

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]

[mcp_servers.figma-agent-mcp.env]
FIGMA_AGENT_MCP_PORT = "1998"
```

修改后重启 Codex / IDE 扩展。

---

## Qoder

**官方文档：** [Qoder MCP](https://docs.qoder.com/user-guide/chat/model-context-protocol) · [阿里云帮助中心](https://help.aliyun.com/zh/lingma/qoder-cn/user-guide/guide-for-using-mcp)

1. 打开 **Qoder 设置**（头像，或 `⌘⇧,` / `Ctrl+Shift+,`）
2. 左侧 → **MCP**
3. **我的服务** → **+ 添加**
4. 粘贴[通用 JSON 片段](#通用-stdio-配置片段json-类客户端)（STDIO：`npx` + args）
5. 保存 — 链接图标表示已连接；展开可看工具列表

在 Chat 中切换到 **Agent 模式**，以便模型调用 MCP（按提示确认）。也可在 **MCP 广场** 安装；对本包更稳妥的是手动 STDIO 添加。

---

## CodeBuddy

**官方文档：** [CodeBuddy Config MCP](https://www.codebuddy.ai/docs/ide/User-guide/MCP)

1. 侧栏对话面板 → **CodeBuddy Settings**
2. 打开 **MCP** 标签
3. **Add MCP**（或从 **MCP Market** 安装）
4. 粘贴 JSON，例如：

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

5. 确认绿色状态；可用 **Try to Run**，再在 **Craft Agent** 中配合已打开的 Figma 使用

---

## Trae

**官方文档：** [Trae — Add MCP servers](https://docs.trae.ai/ide/add-mcp-servers) · [中文](https://docs.trae.cn/ide_add-mcp-servers)

### 界面（全局）

1. 设置 → **MCP**
2. **添加 → 手动添加**（或从市场添加）
3. 粘贴[通用 JSON 片段](#通用-stdio-配置片段json-类客户端)并确认

也可点 **原始配置（JSON）**，合并进 Trae 的 `mcp.json`。

### 项目级

1. 在项目根创建 `.trae/mcp.json`，写入同样的 `mcpServers` JSON
2. 在 设置 → **MCP** 中开启 **项目级 MCP**（若当前版本提供该开关）

SOLO / Work 模式若工具不稳定：优先项目级配置，并在对话中明确要求使用 `figma-agent-mcp` / `list_files`。

---

## 使用本地构建代替 npx

任意 JSON 客户端可指向构建产物：

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

Codex TOML：

```toml
[mcp_servers.figma-agent-mcp]
command = "node"
args = ["/ABS/PATH/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
```

见 [上手指南 — 从源码开发](./getting-started.md#路径-b--从源码开发)。

---

## 排障速查

| 现象 | 检查 |
|------|------|
| 客户端 0 工具 / 启动失败 | PATH 上有 Node/`npx`；重启客户端 |
| 有工具但 Not connected | 插件已开且桥为绿；1998 仅一个 Leader |
| 端口不对 | `FIGMA_AGENT_MCP_PORT` 与插件 / `bridge.config.json` 一致 |
| 多个 Agent | 正常 — Leader/Follower；只有一个绑端口 |

更多见 [常见问题](./faq.md)。
