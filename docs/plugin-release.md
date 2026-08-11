# Releasing the Figma plugin

**English** | [简体中文](./zh/plugin-release.md)

The plugin is **not** published to npm. Distribution is a **ZIP** on **GitHub Releases**, plus [`releases/version.json`](../releases/version.json) for in-plugin update checks.

MCP npm releases: [mcp-release.md](./mcp-release.md).

## Artifacts

```text
releases/
  version.json                          # latest / notes / downloadUrl (committed on main)
  figma-agent-plugin-vX.Y.Z.zip         # GitHub Release asset (gitignored)
  figma-agent-plugin-vX.Y.Z/            # local unpack for verification (gitignored)
    manifest.json
    dist/code.js
```

Example `downloadUrl`:

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-vX.Y.Z/figma-agent-plugin-vX.Y.Z.zip
```

## Daily release

Working tree clean:

```bash
# Preview
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

# bump → CHANGELOG → build → ZIP → version.json → commit → tag → push
pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

Prefer co-release with MCP:

```bash
pnpm release:kit:patch
```

Pack only (no push):

```bash
pnpm pack:plugin
```

## CI pack only

```bash
gh workflow run pack-plugin.yml
```

Artifact: `figma-agent-plugin-pack`.

## Install a released build

1. Open repository **Releases**
2. Download `figma-agent-plugin-vX.Y.Z.zip`
3. Unzip
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. Select the unzipped `manifest.json`

## Tag convention

```text
figma-agent-plugin-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-plugin/CHANGELOG.md`](../packages/figma-agent-plugin/CHANGELOG.md) must keep `## [Unreleased]` for the release script.

## Related

- [AI features](./ai-features.md) — update check URL
- [MCP release](./mcp-release.md)
