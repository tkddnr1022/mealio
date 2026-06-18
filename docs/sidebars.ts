import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
// @ts-ignore - docs/openapi/sidebar.ts 는 `pnpm gen-api-docs` 로 생성됨
import producerOpenApiSidebar from './docs/openapi/sidebar';

/**
 * Mealio Docusaurus 사이드바.
 * 사이드바 목차 — docs/docs/ Markdown과 1:1 대응
 * OpenAPI 사이드바는 gen-api-docs 로 생성된 docs/openapi/sidebar.ts 를 그대로 병합
 */
const sidebars: SidebarsConfig = {
  openapiSidebar: producerOpenApiSidebar,
  docsSidebar: [
    {
      type: 'category',
      label: '프로젝트',
      collapsed: false,
      items: [
        'project/overview',
        'project/getting-started',
        'project/monorepo',
        'project/infrastructure-environment-variables',
        'project/architecture',
        'project/domain',
        'project/recommendation',
        'project/recipe-ingestion',
        'project/deployment',
        'project/e2e-scenarios',
      ],
    },
    {
      type: 'category',
      label: 'client',
      items: [
        'client/architecture',
        'client/environment-variables',
        'client/components',
        'client/auth',
        'client/api-bff',
        'client/state',
        'client/cache',
        'client/error-toast',
        'client/chatbot-ui',
        'client/accessibility-performance',
      ],
    },
    {
      type: 'category',
      label: 'producer',
      items: [
        'producer/architecture',
        'producer/environment-variables',
        'producer/auth',
        'producer/api',
        'producer/domain-api',
        'producer/recommendation-api',
        'producer/cache',
        'producer/event-publishing',
        'producer/chatbot-sse',
        'producer/operations',
      ],
    },
    {
      type: 'category',
      label: 'consumer',
      items: [
        'consumer/architecture',
        'consumer/environment-variables',
        'consumer/kafka-reliability',
        'consumer/cache',
        'consumer/cache-invalidation',
        'consumer/recommendation-pipeline',
        'consumer/recipe-ingestion',
        'consumer/chatbot',
        'consumer/analytics-pipeline',
        'consumer/batch-jobs',
        'consumer/operations',
      ],
    },
    {
      type: 'category',
      label: 'shared',
      items: [
        'shared/overview',
        'shared/data-models',
        'shared/contracts',
        'shared/redis-cache-contract',
        'shared/environment-variables',
      ],
    },
    {
      type: 'category',
      label: '기타',
      items: [
        'other/development-conventions',
        'other/contributing',
        'other/design-system',
        'other/observability',
        'other/glossary-faq',
      ],
    },
  ],
};

export default sidebars;
