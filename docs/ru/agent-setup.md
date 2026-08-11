# Подключение ИИ-агентов (MCP-клиентов)

**Русский** | [简体中文](../zh/agent-setup.md) | [English](../agent-setup.md)

Как зарегистрировать **`figma-agent-mcp`** в популярных MCP-клиентах. Сначала установите [плагин Figma](./getting-started.md) и перед проверкой инструментов убедитесь, что мост отображается зелёным.

## Общие предварительные требования

1. **Node.js ≥ 20** в вашем PATH (`node -v`, `npx -v`)
2. Запущены Figma Desktop и плагин **Figma Agent Kit** (MCP Bridge подключён)
3. Предпочтительно использовать незакреплённый `npx -y figma-agent-mcp` (всегда последняя версия); закрепляйте `@x.y.z` только для фиксированных установок
4. Необязательный пользовательский порт моста (должен совпадать с плагином):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

### Общий фрагмент stdio (JSON-клиенты)

Большинство редакторов принимают такую структуру в разделе `mcpServers`:

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

### Быстрая проверка (любой клиент)

Выбрав фрейм в Figma, попросите агента выполнить:

1. `list_files`
2. `get_selection`
3. `get_node` / `get_screenshot`

Когда процесс MCP работает корректно, вы увидите **37 инструментов**.

---

## Cursor

**Документация / UI:** Cursor Settings → **MCP** (или отредактируйте JSON напрямую).

| Область | Путь |
|-------|------|
| Пользователь | `~/.cursor/mcp.json` |
| Проект | `.cursor/mcp.json` |

Вставьте [общий фрагмент JSON](#общий-фрагмент-stdio-json-клиенты), сохраните его, затем перезапустите / обновите MCP.

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

Проверьте список MCP в Cursor: **figma-agent-mcp** · **37 активных инструментов**.

![Cursor MCP tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

---

## Claude Code

**Официальное руководство:** [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)

### CLI (рекомендуется)

```bash
# User scope — available in all projects
claude mcp add --scope user figma-agent-mcp -- npx -y figma-agent-mcp

# Or project scope — writes .mcp.json (share with the team)
claude mcp add --scope project figma-agent-mcp -- npx -y figma-agent-mcp
```

Пользовательский порт:

```bash
claude mcp add --scope user figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp
```

### Файлы конфигурации

| Область | Файл |
|-------|------|
| Пользователь | `~/.claude.json` → `mcpServers` верхнего уровня |
| Проект | `.mcp.json` в корне репозитория |
| Локальная | `~/.claude.json` в записи проекта (по умолчанию для CLI) |

Пример `.mcp.json`:

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

Перезапустите Claude Code, затем выполните `/mcp`, чтобы подтвердить подключение сервера. При первом использовании подтвердите серверы проекта из `.mcp.json`, если появится запрос.

---

## Codex (OpenAI)

**Официальное руководство:** [Codex MCP](https://developers.openai.com/codex/mcp)

Codex использует **TOML** (`~/.codex/config.toml` или `.codex/config.toml` проекта для доверенных проектов). ChatGPT desktop / Codex CLI / расширение IDE используют общую конфигурацию.

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

С env:

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]

[mcp_servers.figma-agent-mcp.env]
FIGMA_AGENT_MCP_PORT = "1998"
```

После редактирования перезапустите Codex / расширение IDE.

---

## Qoder

**Официальное руководство:** [Qoder MCP](https://docs.qoder.com/user-guide/chat/model-context-protocol)

1. Откройте **Qoder Settings** (аватар или `⌘⇧,` / `Ctrl+Shift+,`)
2. В левой навигации выберите **MCP**
3. **My Servers** → **+ Add**
4. Вставьте [общий фрагмент JSON](#общий-фрагмент-stdio-json-клиенты) (STDIO: команда `npx`, аргументы указаны выше)
5. Сохраните — значок ссылки означает подключение; разверните элемент, чтобы увидеть инструменты

Используйте в чате **Agent mode**, чтобы модель могла вызывать инструменты MCP (при необходимости подтверждайте запросы).

В качестве альтернативы можно открыть **MCP Square**, если сервер там доступен; для этого пакета надёжнее добавить STDIO вручную.

---

## CodeBuddy

**Официальное руководство:** [CodeBuddy Config MCP](https://www.codebuddy.ai/docs/ide/User-guide/MCP)

1. Чат на боковой панели → **CodeBuddy Settings** (вверху справа)
2. Откройте вкладку **MCP**
3. **Add MCP** (или установите из **MCP Market**, если он представлен)
4. Вставьте JSON, например:

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

5. Подтвердите зелёный статус; при необходимости нажмите **Try to Run**, затем используйте **Craft Agent** с открытой Figma

---

## Trae

**Официальное руководство:** [Trae — Add MCP servers](https://docs.trae.ai/ide/add-mcp-servers) · [中文](https://docs.trae.cn/ide_add-mcp-servers)

### UI (глобально)

1. Settings → **MCP**
2. **Add → Add Manually** (либо marketplace, если доступен)
3. Вставьте [общий фрагмент JSON](#общий-фрагмент-stdio-json-клиенты) и подтвердите

Также можно открыть **Raw Config (JSON)** и объединить конфигурацию с `mcp.json` Trae.

### На уровне проекта

1. Создайте `.trae/mcp.json` в корне проекта с тем же JSON `mcpServers`
2. В Settings → **MCP** включите **project-level MCP**, если в вашей сборке Trae есть этот переключатель

Режим SOLO / Work: если инструменты работают нестабильно, предпочтите конфигурацию на уровне проекта и явно попросите агента использовать `figma-agent-mcp` / `list_files`.

---

## Локальная сборка вместо npx

Укажите любому JSON-клиенту собранный бинарный файл:

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

TOML для Codex:

```toml
[mcp_servers.figma-agent-mcp]
command = "node"
args = ["/ABS/PATH/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
```

См. [Начало работы — из исходников](./getting-started.md#путь-b--разработка-из-исходников).

---

## Устранение неполадок

| Симптом | Что проверить |
|---------|----------------|
| Клиент показывает 0 инструментов / сбой | Node/`npx` в PATH; перезапустите клиент |
| Инструменты доступны, но `Not connected` | Плагин запущен + зелёный мост; один Leader на порту 1998 |
| Неверный порт | Сверьте `FIGMA_AGENT_MCP_PORT` с плагином / `bridge.config.json` |
| Несколько агентов | Это ожидаемо — выбор Leader/Follower; порт привязывает только один процесс |

Подробнее: [FAQ](./faq.md).
