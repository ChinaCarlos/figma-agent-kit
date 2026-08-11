# AI Agent を接続する（MCP クライアント）

[English](../agent-setup.md) | **日本語**

主要な MCP クライアントで **`figma-agent-mcp`** を登録する方法です。先に [Figma プラグイン](./getting-started.md) をインストールし、ツールをテストする前にブリッジを緑色の状態に保ってください。

## 共通の前提条件

1. PATH 上の **Node.js ≥ 20**（`node -v`、`npx -v`）
2. Figma Desktop + 実行中の **Figma Agent Kit** プラグイン（MCP Bridge 接続済み）
3. バージョン未固定の `npx -y figma-agent-mcp` を推奨します（常に最新版）。固定インストール時のみ `@x.y.z` を指定します
4. 任意のカスタムブリッジポート（プラグインと一致させる必要があります）：

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

### 共通の stdio スニペット（JSON クライアント）

多くのエディターは `mcpServers` 配下でこの形式を受け付けます。

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

### 動作確認（すべてのクライアント）

Figma で Frame を選択した状態で、Agent に次を依頼します。

1. `list_files`
2. `get_selection`
3. `get_node` / `get_screenshot`

MCP プロセスが正常なら、**37 tools** が表示されます。

---

## Cursor

**ドキュメント / UI：** Cursor Settings → **MCP**（または JSON を直接編集）。

| スコープ | パス |
|-------|------|
| User | `~/.cursor/mcp.json` |
| Project | `.cursor/mcp.json` |

[共通 JSON スニペット](#共通の-stdio-スニペットjson-クライアント)を貼り付けて保存し、MCP を再起動 / 更新します。

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

Cursor の MCP リストで確認します：**figma-agent-mcp** · **37 tools enabled**。

![Cursor MCP tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

---

## Claude Code

**公式ガイド：** [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)

### CLI（推奨）

```bash
# User scope — available in all projects
claude mcp add --scope user figma-agent-mcp -- npx -y figma-agent-mcp

# Or project scope — writes .mcp.json (share with the team)
claude mcp add --scope project figma-agent-mcp -- npx -y figma-agent-mcp
```

カスタムポート：

```bash
claude mcp add --scope user figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp
```

### 設定ファイル

| スコープ | ファイル |
|-------|------|
| User | `~/.claude.json` → トップレベルの `mcpServers` |
| Project | リポジトリルートの `.mcp.json` |
| Local | プロジェクトエントリ配下の `~/.claude.json`（CLI の既定） |

`.mcp.json` の例：

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

Claude Code を再起動し、`/mcp` を実行してサーバーが接続されていることを確認します。初回のプロンプトでは、プロジェクトの `.mcp.json` サーバーを承認してください。

---

## Codex（OpenAI）

**公式ガイド：** [Codex MCP](https://developers.openai.com/codex/mcp)

Codex は **TOML**（`~/.codex/config.toml`、または信頼するプロジェクト用の `.codex/config.toml`）を使用します。ChatGPT desktop / Codex CLI / IDE extension はこの設定を共有します。

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

env を使用する場合：

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]

[mcp_servers.figma-agent-mcp.env]
FIGMA_AGENT_MCP_PORT = "1998"
```

編集後に Codex / IDE extension を再起動します。

---

## Qoder

**公式ガイド：** [Qoder MCP](https://docs.qoder.com/user-guide/chat/model-context-protocol)

1. **Qoder Settings** を開きます（アバター、または `⌘⇧,` / `Ctrl+Shift+,`）
2. 左側ナビゲーション → **MCP**
3. **My Servers** → **+ Add**
4. [共通 JSON スニペット](#共通の-stdio-スニペットjson-クライアント)を貼り付けます（STDIO：command は `npx`、args は上記）
5. 保存します。リンクアイコンは接続済みを示し、展開するとツールを確認できます

Chat では **Agent mode** を使用してモデルが MCP ツールを呼び出せるようにします（必要に応じてプロンプトを確認します）。

サーバーが表示される場合は **MCP Square** を参照することもできますが、このパッケージでは手動の STDIO 追加が確実です。

---

## CodeBuddy

**公式ガイド：** [CodeBuddy Config MCP](https://www.codebuddy.ai/docs/ide/User-guide/MCP)

1. サイドバーの chat → **CodeBuddy Settings**（右上）
2. **MCP** タブを開きます
3. **Add MCP** を選択します（表示されている場合は **MCP Market** からインストール）
4. 次のような JSON を貼り付けます：

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

5. 緑色のステータスを確認します。必要に応じて **Try to Run** を実行してから、Figma を開いた状態で **Craft Agent** を使用します

---

## Trae

**公式ガイド：** [Trae — Add MCP servers](https://docs.trae.ai/ide/add-mcp-servers) · [中文](https://docs.trae.cn/ide_add-mcp-servers)

### UI（グローバル）

1. Settings → **MCP**
2. **Add → Add Manually** を選択します（利用できる場合は marketplace）
3. [共通 JSON スニペット](#共通の-stdio-スニペットjson-クライアント)を貼り付けて確認します

**Raw Config (JSON)** を開いて、Trae の `mcp.json` にマージすることもできます。

### プロジェクトレベル

1. プロジェクトルートに同じ `mcpServers` JSON を含む `.trae/mcp.json` を作成します
2. 使用中の Trae ビルドにトグルがある場合は、Settings → **MCP** で **project-level MCP** を有効にします

SOLO / Work mode でツールが不安定な場合は、プロジェクトレベルの設定を推奨します。Agent に `figma-agent-mcp` / `list_files` の使用を明示的に依頼してください。

---

## npx の代わりにローカルビルドを使用

任意の JSON クライアントでビルド済みバイナリを指定します。

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

[はじめに — ソースから開発](./getting-started.md#パス-b--ソースから開発)を参照してください。

---

## トラブルシューティング

| 症状 | 確認すること |
|---------|----------------|
| クライアントが 0 tools / failed を表示 | PATH 上の Node/`npx`、クライアントを再起動 |
| ツールは正常だが `Not connected` | プラグインを実行しブリッジを緑色にする。ポート 1998 に Leader が 1 つだけ存在すること |
| ポートが違う | `FIGMA_AGENT_MCP_PORT` をプラグイン / `bridge.config.json` と一致させる |
| 複数の Agent | 想定どおりです。Leader/Follower election により 1 つだけがポートを bind します |

詳細：[FAQ](./faq.md)。
