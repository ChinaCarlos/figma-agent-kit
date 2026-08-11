#!/usr/bin/env node
/**
 * Sync multilingual Markdown from docs/ into docs-site/docs/{zh,en,ko,ja,ru}/
 * for the Rspress site. Runs on docs-site predev / prebuild.
 *
 * Sources:
 *   zh → docs/zh/*.md
 *   en → docs/*.md
 *   ko/ja/ru → docs/{lang}/*.md (fallback to English docs/*.md if missing)
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

/** Default locale has no URL prefix. */
const DEFAULT_LANG = 'zh';
const LOCALES = ['zh', 'en', 'ko', 'ja', 'ru'];

/** @type {Array<{ file: string; dest: string; title: Record<string, string> }>} */
const PAGES = [
  {
    file: 'getting-started.md',
    dest: 'guide/getting-started.md',
    title: {
      zh: '上手指南',
      en: 'Getting started',
      ko: '시작하기',
      ja: 'はじめに',
      ru: 'Быстрый старт',
    },
  },
  {
    file: 'agent-setup.md',
    dest: 'guide/agent-setup.md',
    title: {
      zh: '接入 AI Agent',
      en: 'Connect AI agents',
      ko: 'AI Agent 연결',
      ja: 'AI Agent の接続',
      ru: 'Подключение AI-агентов',
    },
  },
  {
    file: 'screenshots.md',
    dest: 'guide/screenshots.md',
    title: {
      zh: '截图图库',
      en: 'Screenshots',
      ko: '스크린샷',
      ja: 'スクリーンショット',
      ru: 'Скриншоты',
    },
  },
  {
    file: 'ai-features.md',
    dest: 'guide/ai-features.md',
    title: {
      zh: 'AI 功能',
      en: 'AI features',
      ko: 'AI 기능',
      ja: 'AI 機能',
      ru: 'AI-функции',
    },
  },
  {
    file: 'exporting-slices.md',
    dest: 'guide/exporting-slices.md',
    title: {
      zh: '导出切图',
      en: 'Exporting slices',
      ko: '슬라이스 내보내기',
      ja: 'スライス書き出し',
      ru: 'Экспорт слайсов',
    },
  },
  {
    file: 'faq.md',
    dest: 'guide/faq.md',
    title: {
      zh: '常见问题',
      en: 'FAQ',
      ko: 'FAQ',
      ja: 'FAQ',
      ru: 'FAQ',
    },
  },
  {
    file: 'architecture.md',
    dest: 'reference/architecture.md',
    title: {
      zh: '架构说明',
      en: 'Architecture',
      ko: '아키텍처',
      ja: 'アーキテクチャ',
      ru: 'Архитектура',
    },
  },
  {
    file: 'bridge-protocol.md',
    dest: 'reference/bridge-protocol.md',
    title: {
      zh: '桥接协议',
      en: 'Bridge protocol',
      ko: '브리지 프로토콜',
      ja: 'ブリッジプロトコル',
      ru: 'Протокол моста',
    },
  },
  {
    file: 'tools.md',
    dest: 'reference/tools.md',
    title: {
      zh: 'MCP 工具',
      en: 'MCP tools',
      ko: 'MCP 도구',
      ja: 'MCP ツール',
      ru: 'Инструменты MCP',
    },
  },
  {
    file: 'mcp-release.md',
    dest: 'release/mcp-release.md',
    title: {
      zh: 'MCP 发版',
      en: 'MCP release',
      ko: 'MCP 릴리스',
      ja: 'MCP リリース',
      ru: 'Релиз MCP',
    },
  },
  {
    file: 'plugin-release.md',
    dest: 'release/plugin-release.md',
    title: {
      zh: '插件发版',
      en: 'Plugin release',
      ko: '플러그인 릴리스',
      ja: 'プラグインリリース',
      ru: 'Релиз плагина',
    },
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
      /^\*\*(?:简体中文|English|한국어|日本語|Русский)\*\*\s*\|\s*\[[^\]]+\]\([^)]+\)\s*\n+/gm,
      '',
    )
    .replace(
      /^\[(?:简体中文|English|한국어|日本語|Русский)\]\([^)]+\)\s*\|\s*\*\*(?:简体中文|English|한국어|日本語|Русский)\*\*\s*\n+/gm,
      '',
    )
    .replace(/^\[English\]\([^)]+\)\s*\|\s*\*\*简体中文\*\*\s*\n+/gm, '');
}

/**
 * @param {string} lang
 */
function localePrefix(lang) {
  return lang === DEFAULT_LANG ? '' : `/${lang}`;
}

/**
 * @param {string} content
 * @param {string} lang
 */
function rewriteLinks(content, lang) {
  let out = content;
  const prefix = localePrefix(lang);

  for (const [file, route] of Object.entries(ROUTE_BY_FILE)) {
    const base = file.replace(/\.md$/, '');
    const siteRoute = `${prefix}${route}`;
    const patterns = [
      new RegExp(`\\]\\(\\.\\/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\.\\/${base}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\./zh/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\./(?:ko|ja|ru)/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\../${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\../zh/${file}(#[^)]*)?\\)`, 'g'),
      new RegExp(`\\]\\(\\../(?:ko|ja|ru)/${file}(#[^)]*)?\\)`, 'g'),
    ];
    for (const pattern of patterns) {
      out = out.replace(pattern, `](${siteRoute}$1)`);
    }
  }

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
 * Resolve source markdown path for a locale.
 * @param {string} lang
 * @param {string} file
 */
function resolveSource(lang, file) {
  if (lang === 'zh') {
    return path.join(ROOT, 'docs/zh', file);
  }
  if (lang === 'en') {
    return path.join(ROOT, 'docs', file);
  }
  const localized = path.join(ROOT, 'docs', lang, file);
  if (fs.existsSync(localized)) return localized;
  return path.join(ROOT, 'docs', file);
}

/**
 * @param {string} lang
 * @param {{ file: string; dest: string; title: Record<string, string> }} page
 */
function syncOne(lang, page) {
  const src = resolveSource(lang, page.file);
  const destPath = path.join(SITE_DOCS, lang, page.dest);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ 跳过（源文件不存在）: ${path.relative(ROOT, src)}`);
    return;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const raw = fs.readFileSync(src, 'utf8');
  const body = rewriteLinks(stripLangSwitcher(stripFirstHeading(raw)), lang);
  const title = page.title[lang] ?? page.title.en ?? page.file;
  fs.writeFileSync(destPath, `---\ntitle: ${title}\n---\n\n${body}`);
  console.log(`  ✓ ${path.relative(ROOT, src)} → docs-site/docs/${lang}/${page.dest}`);
}

console.log('同步文档到 docs-site/docs …');
copyImages();
for (const page of PAGES) {
  for (const lang of LOCALES) {
    syncOne(lang, page);
  }
}
console.log('完成。');
