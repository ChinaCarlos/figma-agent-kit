# Начало работы

**Русский** | [简体中文](../zh/getting-started.md) | [English](../getting-started.md)

Подключите **Figma Desktop** к ИИ-агенту через локальный MCP-мост.

Поддерживаемые MCP-клиенты (инструкции по настройке): **[Подключение ИИ-агентов](./agent-setup.md)** — Cursor, Claude Code, Codex, Qoder, CodeBuddy, Trae.

## Требования

- [Figma Desktop](https://www.figma.com/downloads/) (рекомендуется; вкладки браузера могут переходить в сон и разрывать WebSocket)
- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9** (для сборки из исходников)
- Агент с поддержкой MCP ([Cursor / Claude Code / Codex / Qoder / CodeBuddy / Trae](./agent-setup.md))

## Путь A — опубликованные пакеты (самый быстрый)

### 1. Установите плагин

1. Откройте страницу [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases)
2. Скачайте `figma-agent-plugin-vX.Y.Z.zip` (версия должна совпадать с версией MCP, которую вы будете запускать)
3. Распакуйте архив
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. Выберите распакованный `manifest.json`
6. Запустите **Plugins → Development → Figma Agent Kit**

После запуска MCP убедитесь, что индикатор состояния моста зелёный (либо переподключается):

![Plugin open in Figma with MCP Bridge connected](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

Используйте элемент управления **minimize** в заголовке для компактного окна, показывающего только выделение:

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

Меню с шестерёнкой (язык, модель, промпты, обновления):

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

### 2. Настройте MCP-сервер

Полные инструкции для каждого клиента: **[Подключение ИИ-агентов](./agent-setup.md)** (Cursor, Claude Code, Codex, Qoder, CodeBuddy, Trae).

**Краткий пример для Cursor** — `~/.cursor/mcp.json` или `.cursor/mcp.json` проекта:

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

Пользовательский порт (должен совпадать со сборкой плагина):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

После редактирования перезапустите агент / MCP-серверы. В панели MCP Cursor должно отображаться **37 активных инструментов**:

![Cursor shows figma-agent-mcp with 37 tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

| Клиент | Стиль конфигурации | Раздел документации |
|--------|--------------|-------------|
| Cursor | `~/.cursor/mcp.json` | [Cursor](./agent-setup.md#cursor) |
| Claude Code | `claude mcp add` / `.mcp.json` | [Claude Code](./agent-setup.md#claude-code) |
| Codex | `codex mcp add` / `~/.codex/config.toml` | [Codex](./agent-setup.md#codex-openai) |
| Qoder | Settings → MCP → JSON | [Qoder](./agent-setup.md#qoder) |
| CodeBuddy | Settings → MCP → JSON | [CodeBuddy](./agent-setup.md#codebuddy) |
| Trae | Settings → MCP / `.trae/mcp.json` | [Trae](./agent-setup.md#trae) |

### 3. Быстрая проверка

Попросите агента:

1. `list_files` — должен отображаться открытый вами файл
2. `get_selection` — сначала выделите фрейм
3. `get_node` / `get_screenshot` — проверьте путь чтения
4. При необходимости `save_screenshots` с `scale: 3`, `compress: true`

## Путь B — разработка из исходников

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

Импортируйте плагин из:

```text
packages/figma-agent-plugin/manifest.json
```

Запустите MCP вручную (необязательно при итеративной разработке):

```bash
pnpm start:mcp
```

Либо укажите Cursor на собранный бинарный файл:

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

Режим наблюдения:

```bash
pnpm dev          # plugin
pnpm dev:mcp      # MCP TypeScript watch
```

После изменений UI/моста: **перезагрузите плагин** в Figma и перезапустите MCP-клиенты.

## Синхронизация порта

Стандартный порт моста — **1998** из [`bridge.config.json`](../bridge.config.json).

```bash
pnpm sync:bridge   # also runs on predev / prebuild
```

Если вы изменили порт: синхронизируйте → пересоберите плагин → повторно импортируйте / перезагрузите его → перезапустите MCP с соответствующим `FIGMA_AGENT_MCP_PORT`.

## Необязательно: ИИ в плагине

Для переименования и визуальной группировки требуется API-ключ, совместимый с OpenAI, в настройках плагина. См. [Возможности ИИ](./ai-features.md).  
Инструментам MCP-моста этот ключ **не** требуется.

## Экспорт срезов (интерфейс плагина)

См. [Экспорт срезов](./exporting-slices.md) для предварительного просмотра 1× / PNG 3× + ZIP из панели плагина.

## Следующие шаги

| Тема | Документ |
|-------|-----|
| Настройка агента / MCP-клиента | [agent-setup.md](./agent-setup.md) |
| Галерея скриншотов | [screenshots.md](./screenshots.md) |
| Архитектура и диаграммы | [architecture.md](./architecture.md) |
| Протокол обмена | [bridge-protocol.md](./bridge-protocol.md) |
| Все 37 инструментов | [tools.md](./tools.md) |
| Устранение неполадок | [faq.md](./faq.md) |
| Выпуск релизов | [mcp-release.md](./mcp-release.md), [plugin-release.md](./plugin-release.md) |
