/**
 * SEO·크롤링 정책 (App Router `sitemap.ts`·`robots.ts`).
 *
 * 경로 문자열은 `@/lib/constants/routes.constants`·`@/lib/auth/routes`를 재사용한다.
 */
import type { MetadataRoute } from 'next';

import { LOGIN_PATH } from '@/lib/auth/routes';
import {
  API_PATH_PREFIX,
  CHATBOT_PATH_PREFIX,
  HOME_PATH,
  INGREDIENT_FILTER_PATH,
  INVENTORY_PATH_PREFIX,
  MONITORING_PATH,
  MYPAGE_PATH_PREFIX,
  OAUTH_PATH_PREFIX,
  RECIPE_FILTER_PATH,
  RECIPE_SEARCH_PATH,
} from '@/lib/constants/routes.constants';

/** `GET /recipes/static-ids` OpenAPI `size` 상한과 동일 */
export const SITEMAP_RECIPE_ID_LIMIT = 500;

/** sitemap에 포함하는 공개 정적 경로 */
export const PUBLIC_SITEMAP_STATIC_PATHS = [
  HOME_PATH,
  RECIPE_FILTER_PATH,
  RECIPE_SEARCH_PATH,
  INGREDIENT_FILTER_PATH,
] as const;

export const STATIC_SITEMAP_CONFIG: Record<
  (typeof PUBLIC_SITEMAP_STATIC_PATHS)[number],
  Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>
> = {
  [HOME_PATH]: { changeFrequency: 'daily', priority: 1 },
  [RECIPE_FILTER_PATH]: { changeFrequency: 'weekly', priority: 0.8 },
  [RECIPE_SEARCH_PATH]: { changeFrequency: 'weekly', priority: 0.7 },
  [INGREDIENT_FILTER_PATH]: { changeFrequency: 'weekly', priority: 0.5 },
};

export const RECIPE_DETAIL_SITEMAP_ENTRY = {
  changeFrequency: 'weekly',
  priority: 0.6,
} as const satisfies Pick<
  MetadataRoute.Sitemap[number],
  'changeFrequency' | 'priority'
>;

/** production `robots.txt` `Disallow` 접두 경로 */
export const ROBOTS_DISALLOW_PATH_PREFIXES = [
  API_PATH_PREFIX,
  MONITORING_PATH,
  LOGIN_PATH,
  `${OAUTH_PATH_PREFIX}/`,
  `${CHATBOT_PATH_PREFIX}/`,
  `${INVENTORY_PATH_PREFIX}/`,
  `${MYPAGE_PATH_PREFIX}/`,
] as const;
