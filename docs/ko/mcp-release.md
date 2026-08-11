# figma-agent-mcp 릴리스

**한국어** | [English](../mcp-release.md)

공개 npm 패키지: [`figma-agent-mcp`](https://www.npmjs.com/package/figma-agent-mcp)

## 책임

| 단계 | 위치 |
|------|--------|
| 버전 올리기 / CHANGELOG / 태그 / 푸시 | 로컬 `pnpm release:mcp:*` 또는 Actions **Release MCP** |
| `pnpm pack` + GitHub Release(`.tgz`) | GitHub Actions |
| `npm publish`(npmjs) | 로컬(`npm login` + `--publish`) 또는 Secret `NPM_TOKEN` |
| GitHub Packages(저장소 사이드바) | Actions가 `GITHUB_TOKEN`으로 `@<owner>/figma-agent-mcp`를 게시 |

저장소의 **Packages** 사이드바는 npmjs나 GitHub Releases가 아닌 [GitHub Packages](https://docs.github.com/packages)(`npm.pkg.github.com`)를 표시합니다. 누락된 게시물을 채우려면 Actions → **Publish GitHub Packages**를 다시 실행하세요.

`NPM_TOKEN`이 설정된 경우 Actions는 npmjs에 `npm publish`도 시도합니다. 설정되지 않았다면 GitHub Release / Packages를 실패시키지 않고 npmjs 게시만 건너뜁니다.

## 최초 1회 npm 로그인

```bash
npm login --registry https://registry.npmjs.org/
npm whoami --registry https://registry.npmjs.org/
```

## 권장: 플러그인과 동시 릴리스

MCP와 플러그인 버전을 일치시킵니다.

```bash
pnpm release:kit:patch   # or minor / major
```

이 명령은 **root + mcp + plugin**의 버전을 올리고, 두 태그를 푸시한 다음 아래를 트리거합니다.

- **Release MCP** → npm(`NPM_TOKEN`이 있는 경우) + GitHub Release
- **Release Plugin** → 플러그인 ZIP GitHub Release

MCP만 릴리스(버전이 달라질 수 있어 권장하지 않음):

```bash
pnpm release:mcp:patch
```

로컬에서 npm에 게시:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
# or after tagging:
cd packages/figma-agent-mcp && npm publish --access public --registry https://registry.npmjs.org/
```

git 없이 버전 올리기:

```bash
cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
```

## CI 패킹만 수행(버전 올리기 / 게시 없음)

```bash
gh workflow run pack-mcp.yml
```

아티팩트: `figma-agent-mcp-pack`(`.tgz`).

## 태그 규칙

```text
figma-agent-mcp-vX.Y.Z
```

## CHANGELOG

[`packages/figma-agent-mcp/CHANGELOG.md`](../packages/figma-agent-mcp/CHANGELOG.md)에는 `## [Unreleased]` 섹션이 유지되어야 합니다. 릴리스 스크립트가 이를 요구합니다(Keep a Changelog).

## 관련 문서

- [플러그인 릴리스](./plugin-release.md)
- [시작하기](./getting-started.md)
