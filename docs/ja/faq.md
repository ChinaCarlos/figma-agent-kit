# よくある質問

[English](../faq.md) | **日本語**

## Agent / MCP クライアント

### 対応しているクライアントは何ですか？

任意の stdio MCP host で `npx -y figma-agent-mcp` を実行できます。次のクライアントを案内しています。

**Cursor · Claude Code · Codex · Qoder · CodeBuddy · Trae** — **[AI Agent を接続する](./agent-setup.md)** を参照してください。

### クライアントは設定済みですが、ツールが失敗する / Not connected と表示されます

1. Figma プラグインのブリッジが緑色であることを確認します
2. クライアントが実際に MCP を起動したことを確認します（PATH 上の `npx` / Node）
3. [agent-setup.md](./agent-setup.md) のクライアント固有のセクションに従います
4. 下記の [ブリッジ / 接続](#ブリッジ--接続) を参照してください

## ブリッジ / 接続

### `list_files` が「Not connected」または空を返します

1. **Figma Desktop** でファイルを開き、**Figma Agent Kit** を実行します
2. プラグインのブリッジインジケーターが緑色であることを確認します
3. 正常な Leader がポート **1998** を 1 つだけ所有していることを確認します（`lsof -iTCP:1998 -sTCP:LISTEN`）
4. そのポート上の孤立した Node プロセスを終了した後、Cursor MCP / `npx figma-agent-mcp` を再起動します
5. バージョンを一致させます。プラグイン ZIP と `figma-agent-mcp` は同じ `0.1.x` である必要があります

### ポートがすでに使用中 / MCP が常に follower になります

古い MCP プロセスが `1998` を保持している可能性があります。孤立した `node` listener を停止してから Agent MCP を再起動し、新しい Leader がポートを bind できるようにします。プラグインは再接続します。

### プラグインに `MsgPack codec not loaded` と表示されます

esbuild により注入された codec が `ui.html` / `code.js` に入るよう、プラグインを再ビルド（`pnpm build`）してから、Development プラグインを**再読み込み**してください。古いプラグインを MsgPack 専用 MCP と組み合わせて実行しないでください。

### ローカル / 未保存ファイルで `fileKey: "unknown"` または `local-…` と表示されます

未保存の Desktop ファイルでは想定どおりです。必要に応じて、プラグインは root の `pluginData` に安定したローカルキーを保存します。クラウドの `fileKey` が必要な場合は、ファイルを Figma cloud に保存してください。

## ツール

### Motion ツールが capability error で失敗します

Motion には `figma.motion` / `applyAnimationStyle` を公開する Figma ビルドが必要です。Figma Desktop をアップデートするか、これらのツールを使用しないでください。

### `.type` に関する `apply_animation_style` validation error

組み込みプリセットには `animationStyleData: { "type": "FIGMA", … }` を渡します（discriminator は `FIGMA` | `USER`）。fade プリセット名を `type` として渡さないでください。

### スクリーンショットが巨大 / Agent のコンテキストがあふれます

`save_screenshots` に `compress: true`（PNG の既定値）を指定してディスクに書き込みます。小さなプレビューにのみ `get_screenshot` を使用してください。スライスとの同等性には `scale: 3` を使用します。

### ページ切り替え後に `getNodeById` / node not found になります

プラグインは `documentAccess: "dynamic-page"` と **`getNodeByIdAsync`** を使用します。`getNodeByIdAsync` をサポートする最近のプラグイン / MCP リリースを使用してください。複数のファイルが接続されている場合は、正しい `fileKey` を渡します。

## AI（プラグイン UI）

### カスタム LLM host がブロックされます

`manifest.json` → `networkAccess.allowedDomains` にホストを追加し、再ビルドして再インポートします。[AI 機能](./ai-features.md) を参照してください。

### MCP に OpenAI キーは必要ですか？

不要です。キーを使用するのは、`clientStorage` の Rename / Group タブのみです。

## インストール / バージョン

### MCP とプラグインのバージョンは一致させる必要がありますか？

**はい。**プロトコルの変更（MsgPack、ツールの形状）では同時アップグレードが必要です。公開時には `pnpm release:kit:*` を推奨します。

### npm パッケージとプラグイン ZIP はどこにありますか？

| 成果物 | 場所 |
|----------|----------|
| `figma-agent-mcp` | [npmjs.com/package/figma-agent-mcp](https://www.npmjs.com/package/figma-agent-mcp) |
| プラグイン ZIP | [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) |
| Scoped GH package | GitHub **Packages** サイドバー（`@ChinaCarlos/figma-agent-mcp`） |

## まだ解決しませんか？

issue を作成する際は、OS、Figma Desktop バージョン、MCP バージョン（`npx figma-agent-mcp` / package version）、UI のプラグインバージョン、および `list_files` / ブリッジインジケーターが動作するかを記載してください。脆弱性の報告（公開 issue ではありません）は [SECURITY.md](../SECURITY.md) を参照してください。
