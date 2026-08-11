# 시작하기

**한국어** | [English](../getting-started.md)

로컬 MCP 브리지를 통해 **Figma Desktop**을 AI 에이전트에 연결합니다.

지원되는 MCP 클라이언트(설정 세부 정보): **[AI 에이전트 연결](./agent-setup.md)** — Cursor, Claude Code, Codex, Qoder, CodeBuddy, Trae.

## 요구 사항

- [Figma Desktop](https://www.figma.com/downloads/) (권장: 브라우저 탭은 절전 상태가 되어 WebSocket 연결이 끊어질 수 있습니다)
- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9** (소스에서 빌드하는 경우)
- MCP를 지원하는 에이전트([Cursor / Claude Code / Codex / Qoder / CodeBuddy / Trae](./agent-setup.md))

## 경로 A — 배포된 패키지 사용(가장 빠름)

### 1. 플러그인 설치

1. [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) 페이지를 엽니다
2. `figma-agent-plugin-vX.Y.Z.zip`을 다운로드합니다(실행할 MCP 버전과 일치해야 함)
3. 압축을 풉니다
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 압축을 푼 `manifest.json`을 선택합니다
6. **Plugins → Development → Figma Agent Kit**을 실행합니다

MCP가 실행되면 브리지 상태 표시기가 녹색이 되는지(또는 재연결되는지) 확인합니다.

![Plugin open in Figma with MCP Bridge connected](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

헤더의 **minimize** 컨트롤을 사용하면 선택 항목만 표시하는 간결한 창으로 전환할 수 있습니다.

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

톱니바퀴 메뉴(언어, 모델, 프롬프트, 업데이트):

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

### 2. MCP 서버 구성

클라이언트별 전체 안내: **[AI 에이전트 연결](./agent-setup.md)** (Cursor, Claude Code, Codex, Qoder, CodeBuddy, Trae).

**Cursor 빠른 예시** — `~/.cursor/mcp.json` 또는 프로젝트의 `.cursor/mcp.json`:

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

사용자 지정 포트(플러그인 빌드와 일치해야 함):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

편집한 후 에이전트 / MCP 서버를 다시 시작합니다. Cursor의 MCP 패널에 **37 tools enabled**가 표시되어야 합니다.

![Cursor shows figma-agent-mcp with 37 tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

| 클라이언트 | 구성 방식 | 문서 섹션 |
|--------|--------------|-------------|
| Cursor | `~/.cursor/mcp.json` | [Cursor](./agent-setup.md#cursor) |
| Claude Code | `claude mcp add` / `.mcp.json` | [Claude Code](./agent-setup.md#claude-code) |
| Codex | `codex mcp add` / `~/.codex/config.toml` | [Codex](./agent-setup.md#codex-openai) |
| Qoder | Settings → MCP → JSON | [Qoder](./agent-setup.md#qoder) |
| CodeBuddy | Settings → MCP → JSON | [CodeBuddy](./agent-setup.md#codebuddy) |
| Trae | Settings → MCP / `.trae/mcp.json` | [Trae](./agent-setup.md#trae) |

### 3. 스모크 테스트

에이전트에 다음을 요청합니다.

1. `list_files` — 열려 있는 파일이 표시되어야 합니다
2. `get_selection` — 먼저 프레임을 선택합니다
3. `get_node` / `get_screenshot` — 읽기 경로를 확인합니다
4. 선택 사항으로 `scale: 3`, `compress: true`를 사용한 `save_screenshots`

## 경로 B — 소스에서 개발

```bash
git clone https://github.com/ChinaCarlos/figma-agent-kit.git
cd figma-agent-kit
pnpm install
pnpm build:all
```

다음 위치에서 플러그인을 가져옵니다.

```text
packages/figma-agent-plugin/manifest.json
```

MCP를 수동으로 시작합니다(반복 작업 중 선택 사항).

```bash
pnpm start:mcp
```

또는 Cursor가 빌드된 바이너리를 가리키도록 설정합니다.

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

감시 모드:

```bash
pnpm dev          # plugin
pnpm dev:mcp      # MCP TypeScript watch
```

UI/브리지 변경 후에는 Figma에서 **플러그인을 다시 로드**하고 MCP 클라이언트를 다시 시작합니다.

## 포트 동기화

기본 브리지 포트는 [`bridge.config.json`](../bridge.config.json)의 **1998**입니다.

```bash
pnpm sync:bridge   # also runs on predev / prebuild
```

포트를 변경하는 경우: 동기화 → 플러그인 재빌드 → 다시 가져오기 / 다시 로드 → 일치하는 `FIGMA_AGENT_MCP_PORT`로 MCP 재시작 순서로 진행합니다.

## 선택 사항: 플러그인 내 AI

이름 변경 및 시각적 그룹화에는 플러그인 설정에서 OpenAI 호환 API 키가 필요합니다. [AI 기능](./ai-features.md)을 참조하세요.  
MCP 브리지 도구에는 해당 키가 **필요하지 않습니다**.

## 슬라이스 내보내기(플러그인 UI)

플러그인 패널에서 1× 미리 보기 / 3× PNG + ZIP을 사용하는 방법은 [슬라이스 내보내기](./exporting-slices.md)를 참조하세요.

## 다음 단계

| 주제 | 문서 |
|-------|-----|
| 에이전트 / MCP 클라이언트 설정 | [agent-setup.md](./agent-setup.md) |
| 스크린샷 갤러리 | [screenshots.md](./screenshots.md) |
| 아키텍처 및 다이어그램 | [architecture.md](./architecture.md) |
| 와이어 프로토콜 | [bridge-protocol.md](./bridge-protocol.md) |
| 전체 37개 도구 | [tools.md](./tools.md) |
| 문제 해결 | [faq.md](./faq.md) |
| 릴리스 | [mcp-release.md](./mcp-release.md), [plugin-release.md](./plugin-release.md) |
