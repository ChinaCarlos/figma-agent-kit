import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rspress/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = 'https://github.com/ChinaCarlos/figma-agent-kit';

export default defineConfig({
  root: 'docs',
  base: '/figma-agent-kit/',
  title: 'Figma Agent Kit',
  description: 'Open-source Figma Desktop plugin + local MCP bridge for AI agents',
  icon: '/logo.png',
  logo: {
    light: '/logo.png',
    dark: '/logo.png',
  },
  logoText: 'Figma Agent Kit',
  lang: 'zh',
  locales: [
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Figma Agent Kit',
      description: '开源 Figma Desktop 插件 + 本地 MCP 桥，让 AI Agent 读写当前设计稿',
    },
    {
      lang: 'en',
      label: 'English',
      title: 'Figma Agent Kit',
      description:
        'Open-source Figma Desktop plugin + local MCP bridge for AI agents',
    },
  ],
  globalStyles: path.join(__dirname, 'theme/index.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: REPO,
      },
    ],
    footer: {
      message: 'MIT Licensed · Figma Agent Kit',
      copyright: 'Copyright © 2026 Figma Agent Kit Contributors',
    },
  },
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
