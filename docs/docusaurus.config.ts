import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const isCI = process.env.CI === 'true';
const brokenLinkPolicy = isCI ? 'throw' : 'warn';

const config: Config = {
  title: 'Mealio Docs',
  tagline: 'AI 기반 맞춤형 레시피 추천 플랫폼',
  url: 'https://tkddnr1022.github.io',
  baseUrl: isGithubPages ? '/mealio/' : '/',
  organizationName: 'tkddnr1022',
  projectName: 'mealio',
  onBrokenLinks: brokenLinkPolicy,
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: brokenLinkPolicy,
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Mealio Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '문서',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Mealio.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
