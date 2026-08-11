#!/usr/bin/env node
/**
 * Sync bilingual Markdown from docs/ + docs/zh/ into docs-site/docs/{zh,en}/
 * for the Rspress site. Runs on docs-site predev / prebuild.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_DOCS = path.join(ROOT, 'docs-site/docs');
const REPO = 'https://github.com/ChinaCarlos/figma-agent-kit';
const REPO_BLOB = `${REPO}/blob/main`;
const RAW_IMAGE_PREFIX =
  'https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/docs/images/';

/** @type {Array<{ file: string; dest: string; title: { zh: string; en: string } }>} */
const PAGES = [
  {
    file: 'getting-started.md',
    dest: 'guide/getting-started.md',
    title: { zh: '上手指南', en: 'Getting started' },
  },
  {
    file: 'agent-setup.md',
    dest: 'guide/agent-setup.md',
    title: { zh: '接入 AI Agent', en: 'Connect AI agents' },
  },
  {
    file: 'screenshots.md',
    dest: 'guide/screenshots.md',
    title: { zh: '截图图库', en: 'Screenshots' },
  },
  {
    file: 'ai-features.md',
    dest: 'guide/ai-features.md',
    title: { zh: 'AI 功能', en: 'AI features' },
  },
  {
    file: 'exporting-slices.md',
    dest: 'guide/exporting-slices.md',
    title: { zh: '导出切图', en: 'Exporting slices' },
  },
  {
    file: 'faq.md',
    dest: 'guide/faq.md',
    title: { zh: '常见问题', en: 'FAQ' },
  },
  {
    file: 'architecture.md',
    dest: 'reference/architecture.md',
    title: { zh: '架构说明', en: 'Architecture' },
  },
  {
    file: 'bridge-protocol.md',
    dest: 'reference/bridge-protocol.md',
    title: { zh: '桥接协议', en: 'Bridge protocol' },
  },
  {
    file: 'tools.md',
    dest: 'reference/tools.md',
    title: { zh: 'MCP 工具', en: 'MCP tools' },
  },
  {
    file: 'mcp-release.md',
    dest: 'release/mcp-release.md',
    title: { zh: 'MCP 发版', en: 'MCP release' },
  },
  {
    file: 'plugin-release.md',
    dest: 'release/plugin-release.md',
    title: { zh: '插件发版', en: 'Plugin release' },
  },
];

const ROUTE_BY_FILE = Object.fromEntries(
  PAGES.map((p) => [p.file, `/${p.dest.replace(/\.md$/, '')}`]),
);

function stripFirstHeading(content) {
  return content.replace(/^#\s+.+\n+/, '');
}

/** Remove bilingual switcher lines; Rspress locale switcher covers this. */
function stripLangSwitcher(content) {
  return content
    .replace(
      /^\*\*(?:简体中文|English)\*\*\s*\|\s*\[[^\]]+\]\([^)]+\)\s*\n+/gm,
      '',
    )
    .replace(
      /^\[(?:简体中文|English)\]\([^)]+\)\s*\|\s*\*\*(?:简体中文|English)\*\*\s*\n+/gm,
      '',
    )
    .replace(/^\[English\]\([^)]+\)\s*\|\s*\*\*简体中文\*\*\s*\n+/gm, '');
}

/**
 * @param {string} content
 * @param {'zh' | 'en'} lang
 */
function rewriteLinks(content, lang) {
  let out = content;
  const prefix = lang === 'zh' ? '' : '/en';

  for (const [file, route] of Object.entries(ROUTE_BY_FILE)) {
    const base = file.replace(/\.md$/, '');
    const siteRoute = `${prefix}${route}`;
    const patterns = [
      new RegExp(`\\]\\(\\.\\/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\.\\/${base}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\./zh/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\../${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\../zh/${file}(#[^)]*)?\\)`, 'g'),
    ];
    for (const pattern of patterns) {
      out = out.replace(pattern, `](${siteRoute}$1)`);
    }
  }

  // Repo root community docs → GitHub
  const githubMap = [
    [/\]\(\.\.\/CONTRIBUTING\.md([^)]*)\)/g, `](${REPO_BLOB}/CONTRIBUTING.md$1)`],
    [/\]\(\.\.\/\.\.\/CONTRIBUTING\.md([^)]*)\)/g, `](${REPO_BLOB}/CONTRIBUTING.md$1)`],
    [/\]\(\.\.\/SECURITY\.md([^)]*)\)/g, `](${REPO_BLOB}/SECURITY.md$1)`],
    [/\]\(\.\.\/\.\.\/SECURITY\.md([^)]*)\)/g, `](${REPO_BLOB}/SECURITY.md$1)`],
    [/\]\(\.\.\/CODE_OF_CONDUCT\.md([^)]*)\)/g, `](${REPO_BLOB}/CODE_OF_CONDUCT.md$1)`],
    [/\]\(\.\.\/\.\.\/CODE_OF_CONDUCT\.md([^)]*)\)/g, `](${REPO_BLOB}/CODE_OF_CONDUCT.md$1)`],
    [/\]\(\.\.\/README\.md([^)]*)\)/g, `](${REPO}$1)`],
    [/\]\(\.\.\/\.\.\/README\.md([^)]*)\)/g, `](${REPO}$1)`],
    [/\]\(\.\.\/README\.en\.md([^)]*)\)/g, `](${REPO_BLOB}/README.en.md$1)`],
    [/\]\(\.\.\/\.\.\/README\.en\.md([^)]*)\)/g, `](${REPO_BLOB}/README.en.md$1)`],
    [/\]\(\.\.\/LICENSE([^)]*)\)/g, `](${REPO_BLOB}/LICENSE$1)`],
  ];
  for (const [pattern, replacement] of githubMap) {
    out = out.replace(pattern, replacement);
  }

  // Screenshots: prefer local public assets when available
  out = out.replace(
    new RegExp(
      RAW_IMAGE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^)\\s]+)',
      'g',
    ),
    '/images/$1',
  );
  out = out.replace(/\]\(\.\/images\/([^)]+)\)/g, '](/images/$1)');
  out = out.replace(/\]\(\.\.\/images\/([^)]+)\)/g, '](/images/$1)');

  out = out.replace(/```env\b/g, '```bash');

  return out;
}

function copyImages() {
  const srcDir = path.join(ROOT, 'docs/images');
  const destDir = path.join(SITE_DOCS, 'public/images');
  if (!fs.existsSync(srcDir)) {
    console.warn('  ⚠ docs/images 不存在，跳过图片同步');
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, name);
    if (!fs.statSync(src).isFile()) continue;
    fs.copyFileSync(src, path.join(destDir, name));
    console.log(`  ✓ docs/images/${name} → docs/public/images/`);
  }
}

/**
 * @param {'zh' | 'en'} lang
 * @param {{ file: string; dest: string; title: { zh: string; en: string } }} page
 */
function syncOne(lang, page) {
  const src =
    lang === 'zh'
      ? path.join(ROOT, 'docs/zh', page.file)
      : path.join(ROOT, 'docs', page.file);
  const destPath = path.join(SITE_DOCS, lang, page.dest);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ 跳过（源文件不存在）: ${path.relative(ROOT, src)}`);
    return;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const raw = fs.readFileSync(src, 'utf8');
  const body = rewriteLinks(stripLangSwitcher(stripFirstHeading(raw)), lang);
  const title = page.title[lang];
  fs.writeFileSync(destPath, `---\ntitle: ${title}\n---\n\n${body}`);
  console.log(`  ✓ ${path.relative(ROOT, src)} → docs-site/docs/${lang}/${page.dest}`);
}

console.log('同步文档到 docs-site/docs …');
copyImages();
for (const page of PAGES) {
  syncOne('zh', page);
  syncOne('en', page);
}
console.log('完成。');
