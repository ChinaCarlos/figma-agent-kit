# 스크린샷

**한국어** | [English](../screenshots.md)

Figma 플러그인과 Cursor MCP 설정을 시각적으로 살펴봅니다.

## Figma Desktop의 플러그인

**MCP Bridge**가 연결된 녹색 상태, 선택 항목, 기능 모듈이 표시된 전체 패널입니다.

![Figma Agent Kit plugin open in Figma Desktop](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-in-figma.png)

## 설정 메뉴

톱니바퀴 메뉴: 모델 설정, 프롬프트 설정, 업데이트 확인 및 **中文 / English** 언어 전환.

![Plugin settings menu](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-settings-menu.png)

## 모델 설정

OpenAI 호환 **API base URL**, 모델 이름, API 키, **Test connection**을 설정합니다.

![Model settings dialog](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-model-settings.png)

## 슬라이스 내보내기

**Export** 탭: 1× 미리 보기, 편집 가능한 파일명, 단일 다운로드 및 **ZIP** 패키지(3× PNG).

![Export slices module](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-export-slices.png)

## 프롬프트 설정

이름 변경 / 그룹화를 위한 편집 가능한 시스템 프롬프트(`{{candidates}}` 및 관련 플레이스홀더).

![AI prompt settings](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-prompt-settings.png)

## 미니 모드

간결한 창: 브리지 상태와 현재 선택 항목만 표시합니다(헤더의 minimize 컨트롤 사용).

![Plugin mini mode](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/plugin-mini-mode.png)

## Cursor MCP 구성

`npx`를 사용하는 `mcp.json` 항목 예시입니다(버전을 고정하지 않으면 npx가 최신 버전을 설치함).

![Cursor mcp.json configuration](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-config.png)

## Cursor MCP 도구

성공적으로 연결되면 Cursor에 **figma-agent-mcp**와 **37 tools enabled**가 표시됩니다.

![Cursor MCP tools list](https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/cursor-mcp-tools.png)

## 관련 문서

- [시작하기](./getting-started.md)
- [AI 기능](./ai-features.md)
- [슬라이스 내보내기](./exporting-slices.md)
