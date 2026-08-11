# スクリーンショット

[English](../screenshots.md) | **日本語**

Figma プラグインと Cursor MCP セットアップのビジュアルツアーです。

## Figma Desktop のプラグイン

**MCP Bridge** が接続済み（緑のステータス）で、選択内容と機能モジュールを表示するフルパネルです。

![Figma Agent Kit plugin open in Figma Desktop](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

## 設定メニュー

歯車メニュー：モデル設定、プロンプト設定、アップデート確認、**中文 / English** の言語切り替えです。

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

## モデル設定

OpenAI 互換の **API ベース URL**、モデル名、API キー、**Test connection** を設定します。

![Model settings dialog](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-model-settings.png)

## スライスの書き出し

**Export** タブ：1× プレビュー、編集可能なファイル名、単体ダウンロード、**ZIP** パック（3× PNG）です。

![Export slices module](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-export-slices.png)

## プロンプト設定

rename / group 用の編集可能なシステムプロンプト（`{{candidates}}` および関連するプレースホルダー）です。

![AI prompt settings](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-prompt-settings.png)

## ミニモード

コンパクトなウィンドウ：ブリッジのステータスと現在の選択内容のみを表示します（ヘッダーの最小化コントロールを使用）。

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

## Cursor MCP 設定

`npx` を使用する `mcp.json` エントリの例です（バージョン未固定。npx は最新をインストールします）。

![Cursor mcp.json configuration](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

## Cursor MCP ツール

接続に成功すると、Cursor は **figma-agent-mcp** と **37 tools enabled** を表示します。

![Cursor MCP tools list](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

## 関連ドキュメント

- [はじめに](./getting-started.md)
- [AI 機能](./ai-features.md)
- [スライスを書き出す](./exporting-slices.md)
