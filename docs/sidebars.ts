import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Mealio Docusaurus 사이드바.
 * 목차 SSOT: agent/docusaurus_documentation_plan.md
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: '프로젝트',
      collapsed: false,
      items: [
        'project/getting-started',
        'project/overview',
        'project/domain',
        'project/architecture',
        'project/e2e-scenarios',
        'project/recommendation',
        'project/recipe-ingestion',
        'project/monorepo',
        'project/deployment',
        'project/contracts-index',
      ],
    },
    {
      type: 'category',
      label: 'client',
      items: [
        'client/architecture',
        'client/components',
        'client/auth',
        'client/cache',
        'client/api-bff',
        'client/state',
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
        'producer/auth',
        'producer/cache',
        'producer/domain-api',
        'producer/recommendation-api',
        'producer/api',
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
        'consumer/kafka-reliability',
        'consumer/cache',
        'consumer/cache-invalidation',
        'consumer/chatbot',
        'consumer/recommendation-pipeline',
        'consumer/analytics-pipeline',
        'consumer/recipe-ingestion',
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
        'shared/redis-cache-contract',
        'shared/contracts',
      ],
    },
    {
      type: 'category',
      label: '기타',
      items: [
        'other/observability',
        'other/design-system',
        'other/contributing',
        'other/development-conventions',
        'other/glossary-faq',
      ],
    },
  ],
};

export default sidebars;
