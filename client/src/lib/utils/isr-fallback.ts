import type { Paginated } from '@/lib/types/api';

/** `{ data, pagination }` 형태 API 응답의 빈 폴백. */
export function createEmptyPaginated<T>(): Paginated<T> {
  return {
    data: [],
    pagination: {
      page: 1,
      size: 0,
      total: 0,
      totalPages: 0,
    },
  };
}

/** `{ data: T[] }` 형태 API 응답의 빈 폴백. */
export function createEmptyDataList<T>(): { data: T[] } {
  return { data: [] };
}
