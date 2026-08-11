# Figma Agent Kit

[English](./README.md) | **简体中文**

[![CI](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/figma-agent-mcp.svg)](https://www.npmjs.com/package/figma-agent-mcp)
[![npm downloads](https://img.shields.io/npm/dm/figma-agent-mcp.svg)](https://www.npmjs.com/package/figma-agent-mcp)
[![GitHub release](https://img.shields.io/github/v/release/ChinaCarlos/figma-agent-kit)](https://github.com/ChinaCarlos/figma-agent-kit/releases)
[![Pack MCP](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/pack-mcp.yml/badge.svg)](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/pack-mcp.yml)
[![Pack Plugin](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/pack-plugin.yml/badge.svg)](https://github.com/ChinaCarlos/figma-agent-kit/actions/workflows/pack-plugin.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

[![Cursor](https://img.shields.io/badge/Cursor-MCP-000000?style=flat-square)](./docs/zh/agent-setup.md#cursor)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-MCP-D97706?style=flat-square)](./docs/zh/agent-setup.md#claude-code)
[![Codex](https://img.shields.io/badge/Codex-MCP-10A37F?style=flat-square)](./docs/zh/agent-setup.md#codexopenai)
[![Qoder](https://img.shields.io/badge/Qoder-MCP-2563EB?style=flat-square)](./docs/zh/agent-setup.md#qoder)
[![CodeBuddy](https://img.shields.io/badge/CodeBuddy-MCP-7C3AED?style=flat-square)](./docs/zh/agent-setup.md#codebuddy)
[![Trae](https://img.shields.io/badge/Trae-MCP-0EA5E9?style=flat-square)](./docs/zh/agent-setup.md#trae)

**开源 Figma Desktop 插件 + 本地 MCP 桥**：让 AI 编程 Agent **读写**当前打开的设计稿，无需经 Figma REST API 上传画布。

已适配 **Cursor · Claude Code · Codex · Qoder · CodeBuddy · Trae**（以及其他支持 stdio MCP 的宿主）。

<p align="center">
  <img src="https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png" alt="Figma Desktop 中已连接 MCP Bridge 的插件界面" width="720" />
</p>

```mermaid
flowchart LR
  Agent[AI_Agent] -->|stdio_MCP| McpProc[figma_agent_mcp]
  McpProc -->|Election| Role{Leader_or_Follower}
  Role -->|WS_MsgPack| PluginUI[Plugin_UI]
  PluginUI -->|postMessage| PluginMain[Plugin_main]
  PluginMain --> FigmaAPI[Figma_Plugin_API]
```

深入阅读：[架构说明](./docs/zh/architecture.md) · [截图图库](./docs/zh/screenshots.md) · [英文文档](./docs/README.md)

## 支持的编辑器

`figma-agent-mcp` 是标准 **stdio MCP** 服务，可接入你正在用的 AI 编辑器：

| 编辑器 / IDE | 接入入口 | 配置方式 |
|--------------|----------|----------|
| **[Cursor](./docs/zh/agent-setup.md#cursor)** | Settings → MCP，或 `~/.cursor/mcp.json` | JSON `mcpServers` |
| **[Claude Code](./docs/zh/agent-setup.md#claude-code)** | `claude mcp add` 或 `.mcp.json` | JSON / CLI |
| **[Codex](./docs/zh/agent-setup.md#codexopenai)**（OpenAI） | `codex mcp add` 或 `~/.codex/config.toml` | TOML / CLI |
| **[Qoder](./docs/zh/agent-setup.md#qoder)** | 设置 → MCP → 添加 | JSON `mcpServers` |
| **[CodeBuddy](./docs/zh/agent-setup.md#codebuddy)** | 设置 → MCP → Add MCP | JSON `mcpServers` |
| **[Trae](./docs/zh/agent-setup.md#trae)** | 设置 → MCP，或 `.trae/mcp.json` | JSON `mcpServers` |

完整复制粘贴配置：**[接入 AI Agent](./docs/zh/agent-setup.md)** · [English guide](./docs/agent-setup.md)

> 其他兼容 MCP 的客户端同样适用：用 stdio 运行 `npx -y figma-agent-mcp` 即可。

## 为什么需要它

| 需求 | 本项目提供 |
|------|------------|
| Agent ↔ 实时画布 | 37 个 MCP 工具（读 / 写 / 截图 / Motion） |
| 本地隐私 | 桥接流量走 `localhost`（默认端口 **1998**） |
| 多 Agent 窗口 | Leader / Follower 选举 — 共用一条 WS 桥 |
| 设计师工作流 | 可选 AI 重命名 / 分组、3× 切图、中英 UI |

## 包说明

| 包 | 分发方式 | 说明 |
|----|----------|------|
| [`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp) | npm / [GitHub Packages](https://github.com/ChinaCarlos/figma-agent-kit/pkgs/npm/figma-agent-mcp) | Stdio MCP + HTTP/WS 桥 |
| `figma-agent-plugin` | [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) ZIP | Figma 插件（桥客户端、AI、切图） |

请保持 MCP 与插件为**同一版本**（见 [npm](https://www.npmjs.com/package/figma-agent-mcp) / [Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases)）。

## 功能特性

- **多编辑器 MCP** — Cursor、Claude Code、Codex、Qoder、CodeBuddy、Trae（[接入指南](./docs/zh/agent-setup.md)）
- **37 个 MCP 工具** — 文档/选区/节点读写、填充、文本、Auto Layout、创建/分组/删除、Motion 等（[目录](./docs/zh/tools.md)）
- **MessagePack 桥** — 二进制 WS + Follower RPC；截图在链路上为原始 PNG 字节
- **`save_screenshots`** — TinyPNG 风格 PNG 压缩；`scale=3` 与插件切图一致
- **插件内 AI** — 视觉重命名与嵌套分组（OpenAI 兼容 API）（[说明](./docs/zh/ai-features.md)）
- **切图导出 UI** — 1× 预览、3× PNG / ZIP（[说明](./docs/zh/exporting-slices.md)）
- **i18n** — 插件界面中文 / English

## 快速开始

### 1. 安装插件

从 [Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) 下载 `figma-agent-plugin-v*.zip`，解压后在 Figma Desktop：

**Plugins → Development → Import plugin from manifest…** → 选择 `manifest.json` → 运行 **Figma Agent Kit**。

状态显示绿色 **MCP Bridge 已连接** 表示插件可与本地 MCP 通信：

| 完整面板 | Mini 模式 |
|----------|-----------|
| ![插件界面](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png) | ![Mini 模式](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png) |

### 2. 接入你的编辑器（MCP）

先在 [支持的编辑器](#支持的编辑器) 选中你的工具，再按对应章节配置：

**[docs/zh/agent-setup.md](./docs/zh/agent-setup.md)** · [English](./docs/agent-setup.md)

**Cursor 快速示例** — `~/.cursor/mcp.json`：

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

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

重启 MCP，打开文件并运行插件。在 Cursor → MCP 设置中应看到 **figma-agent-mcp** 且 **37 tools enabled**：

![Cursor MCP 工具列表](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

然后让 Agent 调用 `list_files` → `get_selection`。

### 3. 从源码构建

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
# 导入 packages/figma-agent-plugin/manifest.json
# pnpm start:mcp   # 可选本地启动
```

完整步骤见 [上手指南](./docs/zh/getting-started.md)。

## 文档索引

| 文档 | 说明 |
|------|------|
| [上手指南](./docs/zh/getting-started.md) | 安装、配置、冒烟测试 |
| [接入 AI Agent](./docs/zh/agent-setup.md) | Cursor / Claude Code / Codex / Qoder / CodeBuddy / Trae |
| [截图图库](./docs/zh/screenshots.md) | 插件 + Cursor 界面截图 |
| [架构说明](./docs/zh/architecture.md) | 模块、技术栈、流程图 |
| [桥接协议](./docs/zh/bridge-protocol.md) | WS / HTTP / MsgPack |
| [MCP 工具](./docs/zh/tools.md) | 工具参考 |
| [AI 功能](./docs/zh/ai-features.md) | 重命名与分组 |
| [导出切图](./docs/zh/exporting-slices.md) | 插件与 MCP 导出 |
| [常见问题](./docs/zh/faq.md) | 排障 |
| [MCP 发版](./docs/zh/mcp-release.md) / [插件发版](./docs/zh/plugin-release.md) | 发布流程 |
| [English docs](./docs/README.md) | 英文文档索引 |

## 安全与隐私

- MCP 桥工具仅通过**本地**插件访问 Figma，不会为 MCP 上传整份文档。
- 可选 AI 重命名/分组会把**截图 + 图层元数据**发往你配置的 API；密钥保存在 Figma `clientStorage`。
- 漏洞披露见 [SECURITY.md](./SECURITY.md)。

## 参与贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [Code of Conduct](./CODE_OF_CONDUCT.md)。

```bash
pnpm install
pnpm build:all
pnpm sync:bridge   # 修改 bridge.config.json 后
```

## 许可证

[MIT](./LICENSE)

## 致谢

灵感来自社区中各类本地 Figma ↔ Agent 桥接实践，面向 Desktop + MCP 优先工作流打造。
