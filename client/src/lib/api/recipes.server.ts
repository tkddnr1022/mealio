import 'server-only';

import { cookies } from 'next/headers';

import { getRecipeList } from '@/lib/api/recipes.api';
import type { RecipeListQuery } from '@/lib/types/recipe';

/**
 * 서버 컴포넌트·ISR 페이지에서 레시피 목록을 조회한다.
 * `credentials: 'include'`가 서버 fetch에 적용되지 않으므로 요청 쿠키를 Cookie 헤더로 넘긴다.
 */
export async function getRecipeListForPage(params: RecipeListQuery = {}) {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return getRecipeList(params, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
}
