import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
import producerOpenApiSidebar from './openapi/sidebar';

/**
 * OpenAPI 레퍼런스 전용 사이드바 (gen-api-docs로 생성된 sidebar.ts 병합)
 */
const sidebars: SidebarsConfig = {
  openapiSidebar: producerOpenApiSidebar,
};

export default sidebars;
