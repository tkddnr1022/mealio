/**
 * 캐시 관련 상수.
 *
 * - React Query 전역·쿼리별 `staleTime`/`gcTime`(TanStack Query v5) 기본값
 * - Next.js ISR `revalidate` 주기
 *
 * 근거:
 * - `agent/frontend/spec/frontend_architecture_spec.md` §4 성능 예산
 * - `agent/frontend/guidelines/frontend_development_guidelines.md` §3.2 페이지별 캐싱 요약
 *
 * 단위:
 * - React Query 값: **밀리초(ms)**
 * - ISR 값: **초(s)** — Next.js `export const revalidate`의 단위
 */

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;

/**
 * React Query 기본값. `QueryClient` 생성 시 `defaultOptions.queries`로 주입한다.
 * - `staleTime`: 데이터가 fresh로 간주되는 시간. 이 시간 내 재요청은 캐시 hit.
 * - `gcTime`: 언마운트 등으로 비활성 상태가 된 뒤 캐시를 GC하기까지의 시간.
 */
export const QUERY_DEFAULTS = {
  staleTime: 5 * MINUTE_MS,
  gcTime: 30 * MINUTE_MS,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

/**
 * 도메인별 React Query 기본값. 리스트는 자주 갱신되어도 되고, 상세는 상대적으로 길게,
 * 유저/세션은 짧게 유지한다.
 */
export const QUERY_CACHE = {
  /** 레시피 목록·검색·필터 결과 — ISR과 보조하여 5분 fresh */
  recipeList: {
    staleTime: 5 * MINUTE_MS,
    gcTime: 30 * MINUTE_MS,
  },
  /** 레시피 상세 — CDN/ISR과 중복 캐싱되므로 10분 fresh */
  recipeDetail: {
    staleTime: 10 * MINUTE_MS,
    gcTime: 60 * MINUTE_MS,
  },
  /** 재료 마스터 데이터 — 거의 변하지 않으므로 길게 */
  ingredient: {
    staleTime: 60 * MINUTE_MS,
    gcTime: 24 * 60 * MINUTE_MS,
  },
  /**
   * 유저 프로필·세션 — 변경 반영을 위해 짧게.
   * `retry: false`: 401(비로그인) 시 즉시 실패 상태로 노출해 재시도하지 않는다.
   */
  user: {
    staleTime: 1 * MINUTE_MS,
    gcTime: 10 * MINUTE_MS,
    retry: false,
  },
  /** 유저 보유·관심 재료 — 변경이 잦으므로 매우 짧게 */
  userIngredient: {
    staleTime: 30 * SECOND_MS,
    gcTime: 10 * MINUTE_MS,
  },
  /** 챗봇 대화 목록·상세 — 메시지 추가가 잦으므로 짧게 */
  chatbot: {
    staleTime: 30 * SECOND_MS,
    gcTime: 10 * MINUTE_MS,
  },
} as const;

/**
 * Next.js ISR `revalidate` 주기(초). 페이지 파일에서
 * `export const revalidate = ISR_REVALIDATE.xxx` 형태로 사용한다.
 *
 * 가이드라인 §3.2:
 * - `/recipes` 계열(메인/검색/필터 목록): 300s
 * - `/recipes/[id]` 상세: 600s
 * - 마케팅(SSG 유사): 24시간
 */
export const ISR_REVALIDATE = {
  recipeList: 300,
  recipeDetail: 600,
  marketing: 24 * 60 * 60,
} as const;

export type QueryDefaults = typeof QUERY_DEFAULTS;
export type QueryCache = typeof QUERY_CACHE;
export type IsrRevalidate = typeof ISR_REVALIDATE;
