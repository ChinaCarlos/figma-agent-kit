# はじめに

[English](../getting-started.md) | **日本語**

ローカル MCP ブリッジを介して、**Figma Desktop** を AI Agent に接続します。

対応する MCP クライアント（セットアップの詳細）：**[AI Agent を接続する](./agent-setup.md)** — Cursor、Claude Code、Codex、Qoder、CodeBuddy、Trae。

## 要件

- [Figma Desktop](https://www.figma.com/downloads/)（推奨。ブラウザタブはスリープして WebSocket が切断されることがあります）
- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9**（ソースからビルドする場合）
- MCP 対応 Agent（[Cursor / Claude Code / Codex / Qoder / CodeBuddy / Trae](./agent-setup.md)）

## パス A — 公開パッケージ（最速）

### 1. プラグインをインストール

1. [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) ページを開きます
2. `figma-agent-plugin-vX.Y.Z.zip` をダウンロードします（実行する MCP のバージョンと一致させます）
3. 展開します
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 展開した `manifest.json` を選択します
6. **Plugins → Development → Figma Agent Kit** を実行します

MCP が実行中の場合、ブリッジステータスインジケーターが緑色（または再接続中）であることを確認します。

![Plugin open in Figma with MCP Bridge connected](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

コンパクトな選択範囲専用ウィンドウには、ヘッダーの**最小化**コントロールを使用します。

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

歯車メニュー（言語、モデル、プロンプト、アップデート）：

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

### 2. MCP サーバーを設定

クライアントごとの完全な手順：**[AI Agent を接続する](./agent-setup.md)**（Cursor、Claude Code、Codex、Qoder、CodeBuddy、Trae）。

**Cursor の簡易例** — `~/.cursor/mcp.json` またはプロジェクトの `.cursor/mcp.json`：

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

![Cursor mcp.json for figma-agent-mcp](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

カスタムポート（プラグインビルドと一致させる必要があります）：

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

編集後に Agent / MCP サーバーを再起動します。Cursor の MCP パネルには **37 tools enabled** と表示されます。

![Cursor shows figma-agent-mcp with 37 tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

| クライアント | 設定方法 | ドキュメントセクション |
|--------|--------------|-------------|
| Cursor | `~/.cursor/mcp.json` | [Cursor](./agent-setup.md#cursor) |
| Claude Code | `claude mcp add` / `.mcp.json` | [Claude Code](./agent-setup.md#claude-code) |
| Codex | `codex mcp add` / `~/.codex/config.toml` | [Codex](./agent-setup.md#codex-openai) |
| Qoder | Settings → MCP → JSON | [Qoder](./agent-setup.md#qoder) |
| CodeBuddy | Settings → MCP → JSON | [CodeBuddy](./agent-setup.md#codebuddy) |
| Trae | Settings → MCP / `.trae/mcp.json` | [Trae](./agent-setup.md#trae) |

### 3. 動作確認

Agent に次を依頼します。

1. `list_files` — 開いているファイルが表示されるはずです
2. `get_selection` — 先に Frame を選択します
3. `get_node` / `get_screenshot` — 読み取り経路を確認します
4. 任意で `save_screenshots` に `scale: 3`、`compress: true` を指定します

## パス B — ソースから開発

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

次からプラグインをインポートします。

```text
packages/figma-agent-plugin/manifest.json
```

MCP を手動で開始します（反復開発中は任意）。

```bash
pnpm start:mcp
```

または Cursor からビルド済みバイナリを指定します。

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

watch モード：

```bash
pnpm dev          # plugin
pnpm dev:mcp      # MCP TypeScript watch
```

UI / ブリッジを変更した後は、Figma で**プラグインを再読み込み**し、MCP クライアントを再起動してください。

## ポート同期

既定のブリッジポートは [`bridge.config.json`](../bridge.config.json) の **1998** です。

```bash
pnpm sync:bridge   # also runs on predev / prebuild
```

ポートを変更する場合：同期 → プラグインを再ビルド → 再インポート / 再読み込み → 一致する `FIGMA_AGENT_MCP_PORT` で MCP を再起動します。

## 任意：プラグイン内 AI

rename と視覚的グループ化には、プラグイン設定内の OpenAI 互換 API キーが必要です。[AI 機能](./ai-features.md) を参照してください。  
MCP ブリッジツールにはそのキーは**不要**です。

## スライス書き出し（プラグイン UI）

プラグインパネルからの 1× プレビュー / 3× PNG + ZIP については、[スライスを書き出す](./exporting-slices.md) を参照してください。

## 次のステップ

| トピック | ドキュメント |
|-------|-----|
| Agent / MCP クライアントのセットアップ | [agent-setup.md](./agent-setup.md) |
| スクリーンショットギャラリー | [screenshots.md](./screenshots.md) |
| アーキテクチャと図 | [architecture.md](./architecture.md) |
| wire プロトコル | [bridge-protocol.md](./bridge-protocol.md) |
| 37 個すべてのツール | [tools.md](./tools.md) |
| トラブルシューティング | [faq.md](./faq.md) |
| リリース | [mcp-release.md](./mcp-release.md)、[plugin-release.md](./plugin-release.md) |
