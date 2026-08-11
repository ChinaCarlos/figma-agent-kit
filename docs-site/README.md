# Figma Agent Kit Docs

Rspress documentation site (zh / en) deployed to GitHub Pages.

## Local development

From the repository root:

```bash
pnpm install
pnpm dev:docs
```

Open `http://localhost:5173/figma-agent-kit/`.

## Build

```bash
pnpm build:docs
```

Output: `docs-site/doc_build/`.

## Content source

Markdown under `docs/` (English) and `docs/zh/` (Chinese) is synced into `docs-site/docs/{en,zh}/` by `scripts/sync-docs-site.mjs` on every `dev` / `build`.

Hand-maintained site files:

- `docs/{zh,en}/index.mdx` — home pages
- `docs/{zh,en}/_nav.json` / `_meta.json` — navigation
- `i18n.json` — nav label translations
- `theme/index.css` — purple / deep-blue brand tokens
- `docs/public/logo.png` · `hero.jpg` · `icons/*` — AI brand artwork

**Nav links must omit the locale prefix** (write `/guide/...`, not `/en/guide/...`). Rspress prefixes the current language automatically; doubling `/en` causes 404s. Home MDX / Markdown body links for English still use `/en/...` because those are not auto-prefixed.

## Deploy

GitHub Actions workflow [Docs](../.github/workflows/docs.yml) builds on `main` and deploys to:

https://chinacarlos.github.io/figma-agent-kit/

Repository Settings → Pages → Source must be **GitHub Actions**.
