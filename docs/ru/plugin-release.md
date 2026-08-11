# Выпуск плагина Figma

**Русский** | [简体中文](../zh/plugin-release.md) | [English](../plugin-release.md)

Плагин **не** публикуется в npm. Он распространяется как **ZIP** в **GitHub Releases** вместе с [`releases/version.json`](../releases/version.json) для проверки обновлений внутри плагина.

Релизы MCP в npm: [mcp-release.md](./mcp-release.md).

## Артефакты

```text
releases/
  version.json                          # latest / notes / downloadUrl (committed on main)
  figma-agent-plugin-vX.Y.Z.zip         # GitHub Release asset (gitignored)
  figma-agent-plugin-vX.Y.Z/            # local unpack for verification (gitignored)
    manifest.json
    dist/code.js
```

Пример `downloadUrl`:

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-vX.Y.Z/figma-agent-plugin-vX.Y.Z.zip
```

## Ежедневный выпуск

Рабочее дерево чистое:

```bash
# Preview
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

# bump → CHANGELOG → build → ZIP → version.json → commit → tag → push
pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

Предпочтите совместный релиз с MCP:

```bash
pnpm release:kit:patch
```

Только упаковка (без push):

```bash
pnpm pack:plugin
```

## Только упаковка CI

```bash
gh workflow run pack-plugin.yml
```

Артефакт: `figma-agent-plugin-pack`.

## Установка выпущенной сборки

1. Откройте **Releases** репозитория
2. Скачайте `figma-agent-plugin-vX.Y.Z.zip`
3. Распакуйте архив
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. Выберите распакованный `manifest.json`

## Соглашение о тегах

```text
figma-agent-plugin-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-plugin/CHANGELOG.md`](../packages/figma-agent-plugin/CHANGELOG.md) должен сохранять `## [Unreleased]` для скрипта релиза.

## Связанные документы

- [Возможности ИИ](./ai-features.md) — URL проверки обновлений
- [Выпуск MCP](./mcp-release.md)
