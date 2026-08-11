# Figma 플러그인 릴리스

**한국어** | [English](../plugin-release.md)

플러그인은 npm에 게시되지 않습니다. 배포물은 **GitHub Releases**의 **ZIP**과 플러그인 내 업데이트 확인용 [`releases/version.json`](../releases/version.json)입니다.

MCP npm 릴리스: [mcp-release.md](./mcp-release.md).

## 아티팩트

```text
releases/
  version.json                          # latest / notes / downloadUrl (committed on main)
  figma-agent-plugin-vX.Y.Z.zip         # GitHub Release asset (gitignored)
  figma-agent-plugin-vX.Y.Z/            # local unpack for verification (gitignored)
    manifest.json
    dist/code.js
```

`downloadUrl` 예시:

```text
https://github.com/ChinaCarlos/figma-agent-kit/releases/download/figma-agent-plugin-vX.Y.Z/figma-agent-plugin-vX.Y.Z.zip
```

## 일상적인 릴리스

작업 트리를 깨끗한 상태로 유지합니다.

```bash
# Preview
cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run

# bump → CHANGELOG → build → ZIP → version.json → commit → tag → push
pnpm release:plugin:patch
pnpm release:plugin:minor
pnpm release:plugin:major
```

MCP와의 동시 릴리스를 권장합니다.

```bash
pnpm release:kit:patch
```

패킹만 수행(푸시 없음):

```bash
pnpm pack:plugin
```

## CI 패킹만 수행

```bash
gh workflow run pack-plugin.yml
```

아티팩트: `figma-agent-plugin-pack`.

## 릴리스 빌드 설치

1. 저장소의 **Releases**를 엽니다
2. `figma-agent-plugin-vX.Y.Z.zip`을 다운로드합니다
3. 압축을 풉니다
4. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
5. 압축을 푼 `manifest.json`을 선택합니다

## 태그 규칙

```text
figma-agent-plugin-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-plugin/CHANGELOG.md`](../packages/figma-agent-plugin/CHANGELOG.md)에는 릴리스 스크립트가 요구하는 `## [Unreleased]`가 유지되어야 합니다.

## 관련 문서

- [AI 기능](./ai-features.md) — 업데이트 확인 URL
- [MCP 릴리스](./mcp-release.md)
