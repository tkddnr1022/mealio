/**
 * React Query 캐시 정책.
 *
 * 근거: `agent/frontend/spec/frontend_architecture_spec.md` §4,
 * `agent/frontend/guidelines/frontend_development_guidelines.md` §3.2
 *
 * 단위: 밀리초(ms)
 */
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
