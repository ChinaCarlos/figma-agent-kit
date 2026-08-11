# AI 에이전트 연결(MCP 클라이언트)

**한국어** | [English](../agent-setup.md)

주요 MCP 클라이언트에 **`figma-agent-mcp`**를 등록하는 방법입니다. 먼저 [Figma 플러그인](./getting-started.md)을 설치하고, 도구를 테스트하기 전에 브리지가 녹색 상태인지 확인하세요.

## 공통 사전 요구 사항

1. PATH에 있는 **Node.js ≥ 20** (`node -v`, `npx -v`)
2. Figma Desktop과 실행 중인 **Figma Agent Kit** 플러그인(MCP Bridge 연결됨)
3. 고정하지 않은 `npx -y figma-agent-mcp` 사용 권장(항상 최신 버전). 고정 설치에만 `@x.y.z`를 사용합니다
4. 선택 사항인 사용자 지정 브리지 포트(플러그인과 일치해야 함):

```json
"env": { "FIGMA_AGENT_MCP_PORT": "1998" }
```

### 공통 stdio 스니펫(JSON 클라이언트)

대부분의 에디터는 `mcpServers` 아래에서 다음 구조를 지원합니다.

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

### 스모크 테스트(모든 클라이언트)

Figma에서 프레임을 선택한 상태로 에이전트에 다음을 요청합니다.

1. `list_files`
2. `get_selection`
3. `get_node` / `get_screenshot`

MCP 프로세스가 정상이라면 **37 tools**가 표시됩니다.

---

## Cursor

**문서 / UI:** Cursor Settings → **MCP**(또는 JSON을 직접 편집).

| 범위 | 경로 |
|-------|------|
| 사용자 | `~/.cursor/mcp.json` |
| 프로젝트 | `.cursor/mcp.json` |

[공통 JSON 스니펫](#공통-stdio-스니펫json-클라이언트)을 붙여 넣고 저장한 뒤 MCP를 재시작 / 새로 고침합니다.

![Cursor mcp.json](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

Cursor의 MCP 목록에서 **figma-agent-mcp** · **37 tools enabled**를 확인합니다.

![Cursor MCP tools](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

---

## Claude Code

**공식 가이드:** [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)

### CLI(권장)

```bash
# User scope — available in all projects
claude mcp add --scope user figma-agent-mcp -- npx -y figma-agent-mcp

# Or project scope — writes .mcp.json (share with the team)
claude mcp add --scope project figma-agent-mcp -- npx -y figma-agent-mcp
```

사용자 지정 포트:

```bash
claude mcp add --scope user figma-agent-mcp \
  --env FIGMA_AGENT_MCP_PORT=1998 \
  -- npx -y figma-agent-mcp
```

### 구성 파일

| 범위 | 파일 |
|-------|------|
| 사용자 | 최상위 `mcpServers`의 `~/.claude.json` |
| 프로젝트 | 저장소 루트의 `.mcp.json` |
| 로컬 | 프로젝트 항목 아래의 `~/.claude.json`(CLI 기본값) |

`.mcp.json` 예시:

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

Claude Code를 다시 시작한 후 `/mcp`를 실행하여 서버 연결을 확인합니다. 처음 사용할 때 메시지가 나타나면 프로젝트 `.mcp.json` 서버를 승인합니다.

---

## Codex (OpenAI)

**공식 가이드:** [Codex MCP](https://developers.openai.com/codex/mcp)

Codex는 **TOML**을 사용합니다(신뢰된 프로젝트의 `~/.codex/config.toml` 또는 프로젝트 `.codex/config.toml`). ChatGPT desktop / Codex CLI / IDE extension은 이 구성을 공유합니다.

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

환경 변수를 포함하는 경우:

```toml
[mcp_servers.figma-agent-mcp]
command = "npx"
args = ["-y", "figma-agent-mcp"]

[mcp_servers.figma-agent-mcp.env]
FIGMA_AGENT_MCP_PORT = "1998"
```

편집 후 Codex / IDE extension을 다시 시작합니다.

---

## Qoder

**공식 가이드:** [Qoder MCP](https://docs.qoder.com/user-guide/chat/model-context-protocol)

1. **Qoder Settings**를 엽니다(아바타 또는 `⌘⇧,` / `Ctrl+Shift+,`)
2. 왼쪽 탐색 메뉴 → **MCP**
3. **My Servers** → **+ Add**
4. [공통 JSON 스니펫](#공통-stdio-스니펫json-클라이언트)을 붙여 넣습니다(STDIO: command `npx`, args는 위와 같음)
5. 저장합니다 — 연결되면 링크 아이콘이 표시되며, 펼쳐서 도구를 볼 수 있습니다

Chat에서 **Agent mode**를 사용해야 모델이 MCP 도구를 호출할 수 있습니다(필요 시 프롬프트 확인).

대신 서버가 표시된다면 **MCP Square**를 탐색할 수도 있지만, 이 패키지에는 수동 STDIO 추가가 안정적인 방법입니다.

---

## CodeBuddy

**공식 가이드:** [CodeBuddy Config MCP](https://www.codebuddy.ai/docs/ide/User-guide/MCP)

1. 사이드바 채팅 → **CodeBuddy Settings**(오른쪽 상단)
2. **MCP** 탭을 엽니다
3. **Add MCP**를 선택합니다(목록에 있다면 **MCP Market**에서 설치)
4. 다음과 같은 JSON을 붙여 넣습니다.

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

5. 녹색 상태를 확인하고, 선택 사항으로 **Try to Run**을 실행한 뒤 Figma를 연 상태에서 **Craft Agent**를 사용합니다

---

## Trae

**공식 가이드:** [Trae — Add MCP servers](https://docs.trae.ai/ide/add-mcp-servers) · [中文](https://docs.trae.cn/ide_add-mcp-servers)

### UI(전역)

1. Settings → **MCP**
2. **Add → Add Manually**를 선택합니다(사용 가능한 경우 marketplace도 가능)
3. [공통 JSON 스니펫](#공통-stdio-스니펫json-클라이언트)을 붙여 넣고 확인합니다

**Raw Config (JSON)**을 열어 Trae의 `mcp.json`에 병합할 수도 있습니다.

### 프로젝트 수준

1. 프로젝트 루트에 동일한 `mcpServers` JSON으로 `.trae/mcp.json`을 만듭니다
2. Trae 빌드에 해당 토글이 있다면 Settings → **MCP**에서 **project-level MCP**를 활성화합니다

SOLO / Work mode: 도구가 불안정하다면 프로젝트 수준 구성을 사용하고 에이전트에 `figma-agent-mcp` / `list_files` 사용을 명시적으로 요청하세요.

---

## npx 대신 로컬 빌드 사용

모든 JSON 클라이언트가 빌드된 바이너리를 가리키도록 설정할 수 있습니다.

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

Codex TOML:

```toml
[mcp_servers.figma-agent-mcp]
command = "node"
args = ["/ABS/PATH/figma-agent-kit/packages/figma-agent-mcp/dist/index.js"]
```

[시작하기 — 소스에서 개발](./getting-started.md#경로-b--소스에서-개발)을 참조하세요.

---

## 문제 해결

| 증상 | 확인할 사항 |
|---------|----------------|
| 클라이언트에 0개 도구 / 실패가 표시됨 | PATH의 Node/`npx`, 클라이언트 재시작 |
| 도구는 정상이나 `Not connected` | 플러그인 실행 및 녹색 브리지, 포트 1998의 단일 Leader |
| 잘못된 포트 | `FIGMA_AGENT_MCP_PORT`를 플러그인 / `bridge.config.json`과 일치 |
| 여러 에이전트 | 정상입니다 — Leader/Follower 선출이며 하나만 포트를 바인딩합니다 |

추가 정보: [FAQ](./faq.md).
