/**
 * 앱 내부 라우트 경로 상수 (제품 계약).
 */
export const HOME_PATH = '/recipe' as const;
export const RECIPE_SEARCH_PATH = '/recipe/search' as const;
export const RECIPE_FILTER_PATH = '/recipe/filter' as const;
export const INGREDIENT_FILTER_PATH = '/ingredient/filter' as const;

/** BFF·Route Handler 경로 접두 */
export const API_PATH_PREFIX = '/api/' as const;

/** Sentry tunnel (`next.config.ts` `tunnelRoute`) */
export const MONITORING_PATH = '/monitoring' as const;

export const CHATBOT_PATH_PREFIX = '/chatbot' as const;
export const INVENTORY_PATH_PREFIX = '/inventory' as const;
export const MYPAGE_PATH_PREFIX = '/mypage' as const;
export const OAUTH_PATH_PREFIX = '/oauth' as const;
