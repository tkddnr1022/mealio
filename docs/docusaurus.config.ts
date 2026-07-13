import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';
import searchKoWebpackPlugin from './plugins/search-ko-webpack';
import {
  GITHUB_PAGES_BASE_URL,
  GITHUB_REPO,
  GITHUB_USERNAME,
} from './src/constants/github';

const isCI = process.env.CI === 'true';
const brokenLinkPolicy = isCI ? 'throw' : 'warn';

const config: Config = {
  title: 'Mealio Docs',
  tagline: 'AI 기반 맞춤형 레시피 추천 플랫폼',
  url: GITHUB_PAGES_BASE_URL,
  baseUrl: '/',
  organizationName: GITHUB_USERNAME,
  projectName: GITHUB_REPO,
  onBrokenLinks: brokenLinkPolicy,
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: brokenLinkPolicy,
    },
  },
  plugins: [
    searchKoWebpackPlugin,
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'classic',
        config: {
          producer: {
            specPath: '../agent/common/openapi_spec_backend.yaml',
            outputDir: 'docs/openapi',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
            },
            maskCredentials: false,
          } satisfies OpenApiPlugin.Options,
        },
      },
    ],
  ],
  themes: [
    '@docusaurus/theme-mermaid',
    'docusaurus-theme-openapi-docs',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        docsRouteBasePath: ['/'],
        indexBlog: false,
        language: ['ko', 'en'],
        removeDefaultStopWordFilter: ['ko'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],
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
          docItemComponent: '@theme/ApiItem',
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
          docsPluginId: 'default',
          position: 'left',
          label: '문서',
        },
        {
          type: 'docSidebar',
          sidebarId: 'openapiSidebar',
          position: 'left',
          label: 'OpenAPI 레퍼런스',
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
    api: {
      schemaExpansion: {
        default: 1,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
