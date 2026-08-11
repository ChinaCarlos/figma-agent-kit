# 자주 묻는 질문

**한국어** | [English](../faq.md)

## 에이전트 / MCP 클라이언트

### 어떤 클라이언트가 지원되나요?

모든 stdio MCP 호스트에서 `npx -y figma-agent-mcp`를 실행할 수 있습니다. 다음 클라이언트의 사용법을 문서화합니다.

**Cursor · Claude Code · Codex · Qoder · CodeBuddy · Trae** — **[AI 에이전트 연결](./agent-setup.md)**을 참조하세요.

### 클라이언트를 구성했지만 도구가 실패하거나 Not connected가 표시됩니다

1. Figma 플러그인 브리지가 녹색인지 확인합니다
2. 클라이언트가 실제로 MCP를 실행했는지 확인합니다(PATH의 `npx` / Node)
3. [agent-setup.md](./agent-setup.md)의 클라이언트별 섹션을 따릅니다
4. 아래 [브리지 / 연결](#브리지--연결)을 참조합니다

## 브리지 / 연결

### `list_files`가 “Not connected” 또는 빈 값을 반환합니다

1. **Figma Desktop**에서 파일을 열고 **Figma Agent Kit**을 실행합니다
2. 플러그인 브리지 표시기가 녹색인지 확인합니다
3. 정상적인 Leader 하나만 포트 **1998**을 소유하는지 확인합니다(`lsof -iTCP:1998 -sTCP:LISTEN`)
4. 해당 포트에서 고아 Node 프로세스를 종료한 후 Cursor MCP / `npx figma-agent-mcp`를 다시 시작합니다
5. 버전을 일치시킵니다. 플러그인 ZIP과 `figma-agent-mcp`는 동일한 `0.1.x`여야 합니다

### 포트가 이미 사용 중이거나 MCP가 항상 follower입니다

이전 MCP 프로세스가 여전히 `1998`을 점유하고 있을 수 있습니다. 고아 `node` 리스너를 중지한 뒤 에이전트 MCP를 다시 시작하여 새 Leader가 포트를 바인딩하도록 합니다. 플러그인은 다시 연결됩니다.

### 플러그인에 `MsgPack codec not loaded`가 표시됩니다

esbuild로 주입된 코덱이 `ui.html` / `code.js`에 포함되도록 플러그인을 다시 빌드합니다(`pnpm build`). 그런 다음 Development 플러그인을 **다시 로드**합니다. 이전 플러그인을 MsgPack 전용 MCP와 함께 실행하지 마세요.

### 로컬 / 저장되지 않은 파일에 `fileKey: "unknown"` 또는 `local-…`가 표시됩니다

저장되지 않은 Desktop 파일에서는 정상입니다. 필요할 경우 플러그인은 루트 `pluginData`에 안정적인 로컬 키를 저장합니다. 클라우드 `fileKey`가 필요하면 파일을 Figma 클라우드에 저장하세요.

## 도구

### Motion 도구가 capability error와 함께 실패합니다

Motion에는 `figma.motion` / `applyAnimationStyle`을 노출하는 Figma 빌드가 필요합니다. Figma Desktop을 업데이트하거나 해당 도구를 사용하지 마세요.

### `.type`에서 `apply_animation_style` validation error가 발생합니다

내장 프리셋은 `animationStyleData: { "type": "FIGMA", … }`를 전달합니다(discriminator는 `FIGMA` | `USER`). fade 프리셋 이름을 `type`으로 전달하지 마세요.

### 스크린샷이 너무 크거나 에이전트 컨텍스트가 넘칩니다

`compress: true`(PNG 기본값)를 사용해 `save_screenshots`로 디스크에 기록합니다. `get_screenshot`은 작은 미리 보기에만 사용하세요. 슬라이스 동등 설정은 `scale: 3`입니다.

### 페이지 전환 후 `getNodeById` / 노드를 찾을 수 없습니다

플러그인은 `documentAccess: "dynamic-page"` 및 **`getNodeByIdAsync`**를 사용합니다. `getNodeByIdAsync`를 지원하는 최신 플러그인/MCP 릴리스를 사용하세요. 여러 파일이 연결된 경우 올바른 `fileKey`를 전달합니다.

## AI(플러그인 UI)

### 사용자 지정 LLM 호스트가 차단됩니다

`manifest.json` → `networkAccess.allowedDomains`에 호스트를 추가하고 다시 빌드하여 다시 가져옵니다. [AI 기능](./ai-features.md)을 참조하세요.

### MCP에 OpenAI 키가 필요한가요?

아니요. Rename / Group 탭만 `clientStorage`의 키를 사용합니다.

## 설치 / 버전

### MCP와 플러그인 버전이 일치해야 하나요?

**예.** 프로토콜 변경(MsgPack, 도구 형식)에는 함께 업그레이드해야 합니다. 배포할 때는 `pnpm release:kit:*`를 권장합니다.

### npm 패키지와 플러그인 ZIP은 어디에 있나요?

| 아티팩트 | 위치 |
|----------|----------|
| `figma-agent-mcp` | [npmjs.com/package/figma-agent-mcp](https://www.npmjs.com/package/figma-agent-mcp) |
| 플러그인 ZIP | [GitHub Releases](https://github.com/ChinaCarlos/figma-agent-kit/releases) |
| Scoped GH 패키지 | GitHub **Packages** 사이드바(`@ChinaCarlos/figma-agent-mcp`) |

## 여전히 해결되지 않나요?

OS, Figma Desktop 버전, MCP 버전(`npx figma-agent-mcp` / 패키지 버전), UI의 플러그인 버전, `list_files` / 브리지 표시기 동작 여부를 포함하여 이슈를 열어 주세요. 취약점 보고(공개 이슈 아님)는 [SECURITY.md](../SECURITY.md)를 참조하세요.
