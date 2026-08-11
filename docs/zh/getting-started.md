# 上手指南

[English](../getting-started.md) | **简体中文**

通过本地 MCP 桥，将 **Figma Desktop** 连接到 AI Agent。

支持的 MCP 客户端（详细步骤）：**[接入 AI Agent](./agent-setup.md)** — Cursor、Claude Code、Codex、Qoder、CodeBuddy、Trae。

## 环境要求

- [Figma Desktop](https://www.figma.com/downloads/)（推荐；浏览器标签可能休眠导致 WebSocket 断开）
- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9**（从源码构建时需要）
- 支持 MCP 的 Agent（[Cursor / Claude Code / Codex / Qoder / CodeBuddy / Trae](./agent-setup.md)）

## 路径 A — 使用已发布包（最快）

### 1. 安装插件

1. 打开 [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases)
2. 下载 `figma-agent-plugin-vX.Y.Z.zip`（与即将使用的 MCP 版本一致）
3. 解压
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 选择解压目录中的 `manifest.json`
6. 运行 **Plugins → Development → Figma Agent Kit**

MCP 启动后，确认桥状态为绿色（或可手动重连）：

![Figma 中已连接 MCP Bridge 的插件](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

点击标题栏 **最小化** 可进入仅显示选区的紧凑窗口：

![插件 Mini 模式](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

齿轮菜单（语言、模型、提示词、检查更新）：

![插件设置菜单](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

### 2. 配置 MCP

各客户端完整说明见：**[接入 AI Agent](./agent-setup.md)**（Cursor、Claude Code、Codex、Qoder、CodeBuddy、Trae）。

**Cursor 快速示例** — `~/.cursor/mcp.json` 或项目 `.cursor/mcp.json`：

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

![Cursor mcp.json 配置 figma-agent-mcp](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

自定义端口（必须与插件构建一致）：

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

修改后重启 Agent / MCP。在 Cursor 的 MCP 面板应看到 **37 tools enabled**：

![Cursor 显示 figma-agent-mcp 的 37 个工具](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

| 客户端 | 配置方式 | 文档章节 |
|--------|----------|----------|
| Cursor | `~/.cursor/mcp.json` | [Cursor](./agent-setup.md#cursor) |
| Claude Code | `claude mcp add` / `.mcp.json` | [Claude Code](./agent-setup.md#claude-code) |
| Codex | `codex mcp add` / `~/.codex/config.toml` | [Codex](./agent-setup.md#codexopenai) |
| Qoder | 设置 → MCP → JSON | [Qoder](./agent-setup.md#qoder) |
| CodeBuddy | 设置 → MCP → JSON | [CodeBuddy](./agent-setup.md#codebuddy) |
| Trae | 设置 → MCP / `.trae/mcp.json` | [Trae](./agent-setup.md#trae) |

### 3. 冒烟测试

让 Agent 依次调用：

1. `list_files` — 应列出当前打开文件
2. `get_selection` — 先在画布选中 Frame
3. `get_node` / `get_screenshot` — 验证读路径
4. 可选：`save_screenshots`，`scale: 3`，`compress: true`

## 路径 B — 从源码开发

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

导入插件：

```text
packages/figma-agent-plugin/manifest.json
```

手动启动 MCP（可选）：

```bash
pnpm start:mcp
```

或让 Cursor 指向构建产物：

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

监听模式：

```bash
pnpm dev          # 插件
pnpm dev:mcp      # MCP TypeScript watch
```

改 UI/桥后：在 Figma 中 **Reload 插件**，并重启 MCP 客户端。

## 端口同步

默认桥端口 **1998**，来自 [`bridge.config.json`](../../bridge.config.json)。

```bash
pnpm sync:bridge   # predev / prebuild 也会执行
```

改端口后：sync → 重建插件 → 重新 Import/Reload → 用相同 `FIGMA_AGENT_MCP_PORT` 重启 MCP。

## 可选：插件内 AI

重命名与视觉分组需要在插件设置中配置 OpenAI 兼容 API Key。见 [AI 功能](./ai-features.md)。  
**MCP 桥工具不需要**该 Key。

## 切图（插件 UI）

见 [导出切图](./exporting-slices.md)。

## 下一步

| 主题 | 文档 |
|------|------|
| Agent / MCP 客户端接入 | [agent-setup.md](./agent-setup.md) |
| 截图图库 | [screenshots.md](./screenshots.md) |
| 架构与流程图 | [architecture.md](./architecture.md) |
| 线协议 | [bridge-protocol.md](./bridge-protocol.md) |
| 全部 37 工具 | [tools.md](./tools.md) |
| 排障 | [faq.md](./faq.md) |
| 发版 | [mcp-release.md](./mcp-release.md)、[plugin-release.md](./plugin-release.md) |
