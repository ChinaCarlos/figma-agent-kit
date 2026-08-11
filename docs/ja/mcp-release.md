# figma-agent-mcp のリリース

[English](../mcp-release.md) | **日本語**

公開 npm パッケージ：[`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

## 担当範囲

| ステップ | 場所 |
|------|--------|
| バージョン更新 / CHANGELOG / tag / push | ローカルの `pnpm release:mcp:*` または Actions の **Release MCP** |
| `pnpm pack` + GitHub Release（`.tgz`） | GitHub Actions |
| `npm publish`（npmjs） | ローカル（`npm login` + `--publish`）または Secret の `NPM_TOKEN` |
| GitHub Packages（リポジトリのサイドバー） | Actions が `GITHUB_TOKEN` で `@<owner>/figma-agent-mcp` を公開 |

リポジトリの **Packages** サイドバーに表示されるのは [GitHub Packages](https://docs.github.com/packages)（`npm.pkg.github.com`）であり、npmjs や GitHub Releases ではありません。補完するには Actions → **Publish GitHub Packages** を再実行してください。

`NPM_TOKEN` が設定されている場合、Actions は npmjs への `npm publish` も試みます。未設定の場合、GitHub Release / Packages を失敗させずに npmjs への公開をスキップします。

## 初回のみ：npm ログイン

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## 推奨：プラグインと同時にリリース

MCP とプラグインのバージョンを揃えてください。

```bash
pnpm release:kit:patch   # or minor / major
```

このコマンドは **root + mcp + plugin** のバージョンを更新し、2 つの tag を push して、次をトリガーします。

- **Release MCP** → npm（`NPM_TOKEN` がある場合）+ GitHub Release
- **Release Plugin** → プラグイン ZIP の GitHub Release

MCP のみ（バージョンがずれる可能性があり、非推奨）：

```bash
pnpm release:mcp:patch
```

ローカルで npm に公開します。

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
# or after tagging:
cd packages/figma-agent-mcp && npm publish --access public --registry https://registry.npmjs.org/
```

git を使わずにバージョンを更新します。

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## CI の pack のみ（バージョン更新 / 公開なし）

```bash
gh workflow run pack-mcp.yml
```

Artifact：`figma-agent-mcp-pack`（`.tgz`）。

## tag の命名規則

```text
figma-agent-mcp-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-mcp/CHANGELOG.md`](../packages/figma-agent-mcp/CHANGELOG.md) には `## [Unreleased]` セクションを維持する必要があります。リリーススクリプトがこれを要求します（Keep a Changelog）。

## 関連

- [プラグインリリース](./plugin-release.md)
- [はじめに](./getting-started.md)
