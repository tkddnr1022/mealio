import 'server-only';

import { cookies } from 'next/headers';

import { getRecipeList } from '@/lib/api/recipes.api';
import type { RecipeListQuery } from '@/lib/types/recipe';

/**
 * ISR·공개 목록용. `cookies()`를 호출하지 않아 App Router 정적 재검증 경로와 정합된다.
 * 인증이 없으므로 응답에 `isFavorite` 등 개인화 필드가 생략될 수 있다(백엔드 계약).
 */
export async function getRecipeListPublicForPage(
  params: RecipeListQuery = {},
) {
  return getRecipeList(params);
}

/**
 * 서버 컴포넌트에서 JWT 쿠키가 필요한 레시피 목록 조회.
 * `credentials: 'include'`가 서버 fetch에 적용되지 않으므로 요청 쿠키를 Cookie 헤더로 넘긴다.
 * 개인화 섹션·(main) 동적 라우트 등에서 사용한다. ISR 페이지에서는 사용하지 말 것.
 */
export async function getRecipeListPersonalizedForPage(
  params: RecipeListQuery = {},
) {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return getRecipeList(params, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
}
