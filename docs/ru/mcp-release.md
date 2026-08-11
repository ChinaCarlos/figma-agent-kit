# Выпуск figma-agent-mcp

**Русский** | [简体中文](../zh/mcp-release.md) | [English](../mcp-release.md)

Публичный пакет npm: [`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

## Обязанности

| Шаг | Где |
|------|--------|
| Повышение версии / CHANGELOG / тег / push | Локально через `pnpm release:mcp:*` или Actions **Release MCP** |
| `pnpm pack` + GitHub Release (`.tgz`) | GitHub Actions |
| `npm publish` (npmjs) | Локально (`npm login` + `--publish`) или секрет `NPM_TOKEN` |
| GitHub Packages (боковая панель репозитория) | Actions публикует `@<owner>/figma-agent-mcp` с `GITHUB_TOKEN` |

Боковая панель репозитория **Packages** показывает [GitHub Packages](https://docs.github.com/packages) (`npm.pkg.github.com`), а не npmjs и не GitHub Releases. Повторно запустите Actions → **Publish GitHub Packages**, чтобы заполнить его.

Если задан `NPM_TOKEN`, Actions также пытается выполнить `npm publish` в npmjs; если он не задан, публикация в npmjs пропускается без сбоя GitHub Release / Packages.

## Однократный вход npm

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## Рекомендуется: совместный релиз с плагином

Синхронизируйте версии MCP и плагина:

```bash
pnpm release:kit:patch   # or minor / major
```

Команда повышает версию **корня + mcp + плагина**, отправляет два тега и запускает:

- **Release MCP** → npm (если `NPM_TOKEN`) + GitHub Release
- **Release Plugin** → ZIP плагина в GitHub Release

Только MCP (версии могут разойтись — не рекомендуется):

```bash
pnpm release:mcp:patch
```

Опубликовать в npm локально:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
# or after tagging:
cd packages/figma-agent-mcp && npm publish --access public --registry https://registry.npmjs.org/
```

Повысить версию без git:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## Только упаковка CI (без повышения версии / публикации)

```bash
gh workflow run pack-mcp.yml
```

Артефакт: `figma-agent-mcp-pack` (`.tgz`).

## Соглашение о тегах

```text
figma-agent-mcp-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-mcp/CHANGELOG.md`](../packages/figma-agent-mcp/CHANGELOG.md) должен сохранять раздел `## [Unreleased]` — он необходим скрипту релиза (Keep a Changelog).

## Связанные документы

- [Выпуск плагина](./plugin-release.md)
- [Начало работы](./getting-started.md)
