/**
 * Next.js Data Cache 태그 계약 상수.
 *
 * 근거: `agent/frontend/guidelines/frontend_development_guidelines.md` §1·§2.1,
 * `agent/common/openapi_spec_frontend.yaml` `/api/revalidate`
 *
 * fetch `next.tags`와 `POST /api/revalidate` 본문 `tags`에서 공유한다.
 * 계층형 접두(`recipes`, `recipe-list`, `recipe:36`)로 범위별 무효화를 지원한다.
 */

/** 허용 태그 패턴 — 소문자·숫자·하이픈·콜론, 1~64자 */
export const CACHE_TAG_PATTERN = /^[a-z0-9](?:[a-z0-9:-]{0,62}[a-z0-9])?$/;

export const CACHE_TAG_LIMITS = {
  maxTagsPerRequest: 64,
  maxTagLength: 64,
} as const;

/** 도메인·리소스 단위 태그 */
export const CACHE_TAGS = {
  recipes: 'recipes',
  recipeList: 'recipe-list',
  recipeDetail: 'recipe-detail',
  recipeCategories: 'recipe-categories',
  recipeStaticIds: 'recipe-static-ids',
  ingredients: 'ingredients',
  ingredientCategories: 'ingredient-categories',
  sitemap: 'sitemap',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** 레시피 단건 태그 — `recipe:{id}` */
export function recipeDetailTag(recipeId: number | string): string {
  return `recipe:${recipeId}`;
}

/**
 * 레시피 데이터 변경 시 권장 무효화 태그.
 * 상세·목록·static-ids·sitemap을 한 번에 갱신할 때 사용한다.
 */
export function recipeMutationRevalidateTags(
  recipeId: number,
): readonly string[] {
  return [
    CACHE_TAGS.recipes,
    recipeDetailTag(recipeId),
    CACHE_TAGS.recipeList,
    CACHE_TAGS.recipeStaticIds,
    CACHE_TAGS.sitemap,
  ] as const;
}

export function isValidCacheTag(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > CACHE_TAG_LIMITS.maxTagLength) {
    return false;
  }

  return CACHE_TAG_PATTERN.test(trimmed);
}

export function parseRevalidateTags(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  if (raw.length > CACHE_TAG_LIMITS.maxTagsPerRequest) {
    return null;
  }

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (typeof item !== 'string') {
      return null;
    }

    const tag = item.trim();
    if (!isValidCacheTag(tag)) {
      return null;
    }

    if (seen.has(tag)) {
      continue;
    }

    seen.add(tag);
    tags.push(tag);
  }

  return tags.length > 0 ? tags : null;
}
