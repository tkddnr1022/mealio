/**
 * API 공통 타입.
 *
 * - 백엔드는 엔드포인트별로 응답 shape이 상이하다(raw 객체 / 배열 / `{data, pagination}` 등).
 *   공통 래퍼를 강제하지 않고, 실제로 반복되는 shape만 타입화한다.
 * - 여기에 정의된 타입은 `@/lib/api/*` 호출부와 React Query 훅의 반환 타입으로 재사용된다.
 */

/** 페이지네이션 메타데이터 (PaginationDto 1:1) */
export interface Pagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/** `{ data: T[]; pagination }` 형태를 반환하는 리스트 엔드포인트 응답 shape */
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

/** `{ success: boolean }` 단순 mutation 응답 shape */
export interface MutationResult {
  success: boolean;
}

/**
 * 에러 응답 본문 shape.
 * 백엔드가 실제로 내려주는 필드만 옵셔널로 선언한다.
 * `message`는 대부분 존재하지만, 운영 환경에서 생략되는 경우가 있어 옵셔널.
 */
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: unknown;
}
