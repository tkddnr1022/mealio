/**
 * React Query 캐시 정책.
 *
 * 근거: `agent/frontend/spec/frontend_architecture_spec.md` §4,
 * `agent/frontend/guidelines/frontend_development_guidelines.md` §3.2
 *
 * 단위: 밀리초(ms)
 */
import type { RequestOptions } from '@/lib/api/http-client';

import {
  CACHE_TAGS,
  recipeDetailTag,
} from '@/lib/constants/cache-tags.constants';

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;

export const QUERY_DEFAULTS = {
  staleTime: 5 * MINUTE_MS,
  gcTime: 30 * MINUTE_MS,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export const QUERY_CACHE = {
  recipeList: {
    staleTime: 5 * MINUTE_MS,
    gcTime: 30 * MINUTE_MS,
  },
  recommended: {
    staleTime: 20 * MINUTE_MS,
    gcTime: 60 * MINUTE_MS,
  },
  recipeDetail: {
    staleTime: 10 * MINUTE_MS,
    gcTime: 60 * MINUTE_MS,
  },
  ingredient: {
    staleTime: 60 * MINUTE_MS,
    gcTime: 24 * 60 * MINUTE_MS,
  },
  user: {
    staleTime: 1 * MINUTE_MS,
    gcTime: 10 * MINUTE_MS,
    retry: false,
  },
  inventory: {
    staleTime: 30 * SECOND_MS,
    gcTime: 10 * MINUTE_MS,
  },
  chatbot: {
    staleTime: 30 * SECOND_MS,
    gcTime: 10 * MINUTE_MS,
  },
} as const;

export type QueryDefaults = typeof QUERY_DEFAULTS;
export type QueryCache = typeof QUERY_CACHE;

/**
 * Next.js Data Cache(ISR) fetch 정책.
 *
 * 근거: `agent/frontend/guidelines/frontend_development_guidelines.md` §1·§2.1
 * 단위: 초(s) — `fetch` `next.revalidate`에 전달
 */
export const ISR_FETCH_REVALIDATE_SEC = 300;

function isrFetchPeriodic(tags: readonly string[]): RequestOptions {
  return {
    next: {
      revalidate: ISR_FETCH_REVALIDATE_SEC,
      tags: [...tags],
    },
  };
}

function isrFetchOnDemand(tags: readonly string[]): RequestOptions {
  return {
    next: {
      revalidate: false as const,
      tags: [...tags],
    },
  };
}

/** 주기 ISR — 레시피 메인 목록 (`/recipe`) */
export const ISR_RECIPE_LIST_FETCH = isrFetchPeriodic([
  CACHE_TAGS.recipes,
  CACHE_TAGS.recipeList,
]);

/** 주기 ISR — 레시피 카테고리 (`/recipe/filter`) */
export const ISR_RECIPE_CATEGORIES_FETCH = isrFetchPeriodic([
  CACHE_TAGS.recipes,
  CACHE_TAGS.recipeCategories,
]);

/** 주기 ISR — 재료 카테고리 (`/ingredient/filter`) */
export const ISR_INGREDIENT_CATEGORIES_FETCH = isrFetchPeriodic([
  CACHE_TAGS.ingredients,
  CACHE_TAGS.ingredientCategories,
]);

/** 주기 ISR — `generateStaticParams`용 static-ids */
export const ISR_RECIPE_STATIC_IDS_FETCH = isrFetchPeriodic([
  CACHE_TAGS.recipes,
  CACHE_TAGS.recipeStaticIds,
]);

/** 주기 ISR — sitemap 레시피 URL 목록 */
export const ISR_SITEMAP_RECIPE_IDS_FETCH = isrFetchPeriodic([
  CACHE_TAGS.recipes,
  CACHE_TAGS.recipeStaticIds,
  CACHE_TAGS.sitemap,
]);

/** 온디맨드 ISR — 레시피 상세 (`/recipe/[id]`) */
export function isrRecipeDetailFetch(recipeId: number): RequestOptions {
  return isrFetchOnDemand([
    CACHE_TAGS.recipes,
    CACHE_TAGS.recipeDetail,
    recipeDetailTag(recipeId),
  ]);
}
