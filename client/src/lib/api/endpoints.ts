/**
 * 백엔드 API 엔드포인트 경로 상수·빌더.
 *
 * 경로는 백엔드 Producer 명세(`agent/backend/spec/backend_architecture_spec_producer.md` §1.1)와
 * OAuth 명세(`agent/backend/guidelines/oauth_implementation_guidelines.md`)를 따른다.
 *
 * - 동적 세그먼트는 함수 형태로 제공한다(경로 인젝션 방지를 위해 encodeURIComponent 사용).
 * - base URL은 http-client에서 주입하므로 여기서는 path만 정의한다.
 */

import type { OAuthProvider } from '@/lib/types/auth';

export const API_PREFIX = '/api/v1';

export const API_ENDPOINTS = {
  auth: {
    /** OAuth 진입 (백엔드가 Provider 인증 URL로 302 리다이렉트) */
    provider: (provider: OAuthProvider) => `${API_PREFIX}/auth/${provider}`,
    /** OAuth 콜백 (Provider → 백엔드). 프론트엔드에서는 직접 호출하지 않음 */
    providerCallback: (provider: OAuthProvider) =>
      `${API_PREFIX}/auth/${provider}/callback`,
  },
  users: {
    me: `${API_PREFIX}/users/me`,
    meNickname: `${API_PREFIX}/users/me/nickname`,
    meInventory: `${API_PREFIX}/users/me/inventory/ingredients`,
    meInventoryOwned: `${API_PREFIX}/users/me/inventory/ingredients/owned`,
    meInventoryOwnedDetail: (ingredientId: number) =>
      `${API_PREFIX}/users/me/inventory/ingredients/owned/${encodeURIComponent(ingredientId)}`,
    meInventoryFavorites: `${API_PREFIX}/users/me/inventory/ingredients/favorites`,
    meInventoryFavoriteDetail: (ingredientId: number) =>
      `${API_PREFIX}/users/me/inventory/ingredients/favorites/${encodeURIComponent(ingredientId)}`,
  },
  recipes: {
    list: `${API_PREFIX}/recipes`,
    categories: `${API_PREFIX}/recipes/categories`,
    detail: (recipeId: string | number) =>
      `${API_PREFIX}/recipes/${encodeURIComponent(String(recipeId))}`,
    search: `${API_PREFIX}/recipes/search`,
    summaries: `${API_PREFIX}/recipes/summaries`,
  },
  ingredients: {
    list: `${API_PREFIX}/ingredients`,
    search: `${API_PREFIX}/ingredients/search`,
  },
  chatbot: {
    /** SSE 스트리밍 응답 엔드포인트. http-client의 raw 모드 또는 sse-client로 호출 */
    messages: `${API_PREFIX}/chatbot/messages`,
    conversations: `${API_PREFIX}/chatbot/conversations`,
    conversationDetail: (conversationId: string) =>
      `${API_PREFIX}/chatbot/conversations/${encodeURIComponent(conversationId)}`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
