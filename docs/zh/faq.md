# 常见问题

[English](../faq.md) | **简体中文**

## 桥接 / 连接

### `list_files` 返回 Not connected 或空

1. 在 **Figma Desktop** 打开文件并运行 **Figma Agent Kit**
2. 确认插件桥指示灯为绿色
3. 确保端口 **1998** 只有一个健康 Leader（`lsof -iTCP:1998 -sTCP:LISTEN`）
4. 杀掉占用该端口的孤儿 Node 后，重启 Cursor MCP / `npx figma-agent-mcp`
5. 版本对齐：插件 ZIP 与 `figma-agent-mcp` 同为 `0.1.x`

### 端口被占用 / MCP 一直是 Follower

旧 MCP 进程可能仍占用 `1998`。停掉孤儿监听后重启 Agent MCP，让新 Leader 绑端口；插件会重连。

### 插件提示 `MsgPack codec not loaded`

执行 `pnpm build` 重建插件（确保 esbuild 注入 codec），再 **Reload** Development 插件。勿用旧插件对接仅 MsgPack 的 MCP。

### 未保存文件显示 `fileKey: "unknown"` 或 `local-…`

未保存 Desktop 文件属预期。插件会在 root `pluginData` 写入稳定本地 key。需要云端 `fileKey` 时请保存到 Figma 云。

## 工具

### Motion 工具报能力错误

需要暴露 `figma.motion` / `applyAnimationStyle` 的 Figma 版本。升级 Desktop，或跳过这些工具。

### `apply_animation_style` 的 `.type` 校验失败

内置预设请传 `animationStyleData: { "type": "FIGMA", … }`（判别式为 `FIGMA` | `USER`），不要把 fade 预设名当成顶层 `type`。

### 截图过大 / Agent 上下文爆掉

用 `save_screenshots`（PNG 默认 `compress: true`）写磁盘。`get_screenshot` 仅作小预览。切图对齐：`scale: 3`。

### 换页后 `getNodeById` / 找不到节点

插件使用 `documentAccess: "dynamic-page"` 与 **`getNodeByIdAsync`**。请使用 ≥ 0.1.3。多文件时传入正确 `fileKey`。

## AI（插件 UI）

### 自定义 LLM 域名被拦截

把 host 加入 `manifest.json` → `networkAccess.allowedDomains`，重建并重新 Import。见 [AI 功能](./ai-features.md)。

### MCP 需要 OpenAI Key 吗？

不需要。仅「图层重命名 / 视觉分组」使用 `clientStorage` 中的 Key。

## 安装 / 版本

### MCP 与插件版本要对齐吗？

**要。** MsgPack / 工具形状变更需共升。发版优先 `pnpm release:kit:*`。

### npm 包与插件 ZIP 分别在哪？

| 产物 | 位置 |
|------|------|
| `figma-agent-mcp` | [npmjs.com/package/figma-agent-mcp](https://www.npmjs.com/package/figma-agent-mcp) |
| 插件 ZIP | [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) |
| Scoped GH 包 | 仓库 **Packages**（`@ChinaCarlos/figma-agent-mcp`） |

## 仍无法解决？

提 Issue 时附上：OS、Figma Desktop 版本、MCP 版本、插件 UI 版本、`list_files` / 桥指示是否正常。安全问题见 [SECURITY.md](../../SECURITY.md)（勿公开提漏洞）。
