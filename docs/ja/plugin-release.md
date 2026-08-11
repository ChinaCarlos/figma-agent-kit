# Figma プラグインのリリース

[English](../plugin-release.md) | **日本語**

プラグインは npm に公開されません。配布物は **GitHub Releases** の **ZIP** と、プラグイン内の更新確認用 [`releases/version.json`](../releases/version.json) です。

MCP の npm リリースについては、[mcp-release.md](./mcp-release.md) を参照してください。

## 成果物

```text
releases/
  version.json                          # latest / notes / downloadUrl (committed on main)
  figma-agent-plugin-vX.Y.Z.zip         # GitHub Release asset (gitignored)
  figma-agent-plugin-vX.Y.Z/            # local unpack for verification (gitignored)
    manifest.json
    dist/code.js
```

`downloadUrl` の例：

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-vX.Y.Z/figma-agent-plugin-vX.Y.Z.zip
```

## 日常的なリリース

作業ツリーがクリーンであることを確認します。

```bash
# Preview
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

# bump → CHANGELOG → build → ZIP → version.json → commit → tag → push
pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

MCP との同時リリースを推奨します。

```bash
pnpm release:kit:patch
```

pack のみ（push なし）：

```bash
pnpm pack:plugin
```

## CI の pack のみ

```bash
gh workflow run pack-plugin.yml
```

Artifact：`figma-agent-plugin-pack`。

## リリース済みビルドをインストール

1. リポジトリの **Releases** を開きます
2. `figma-agent-plugin-vX.Y.Z.zip` をダウンロードします
3. 展開します
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 展開した `manifest.json` を選択します

## tag の命名規則

```text
figma-agent-plugin-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-plugin/CHANGELOG.md`](../packages/figma-agent-plugin/CHANGELOG.md) には、リリーススクリプトのために `## [Unreleased]` を維持する必要があります。

## 関連

- [AI 機能](./ai-features.md) — 更新確認 URL
- [MCP リリース](./mcp-release.md)
