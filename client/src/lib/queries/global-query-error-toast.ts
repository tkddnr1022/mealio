import type { Mutation, Query } from '@tanstack/react-query';

import { notifyApiError } from '@/lib/toast';

function queryDedupeKey(
  query: Query<unknown, unknown, unknown, readonly unknown[]>,
): string {
  return `rq:q:${JSON.stringify(query.queryKey)}`;
}

function mutationDedupeKey(
  mutation: Mutation<unknown, unknown, unknown, unknown>,
): string {
  const key = mutation.options.mutationKey;
  if (key !== undefined) {
    return `rq:m:${JSON.stringify(key)}`;
  }
  return `rq:m:id:${String(mutation.mutationId)}`;
}

/**
 * {@link QueryClient} `queryCache` 전역 `onError`에서 API 실패 Toast를 표시한다.
 */
export function showGlobalQueryErrorToast(
  error: Error,
  query: Query<unknown, unknown, unknown, readonly unknown[]>,
): void {
  if (query.meta?.suppressGlobalErrorToast) return;
  notifyApiError(error, {
    dedupeKey: queryDedupeKey(query),
    title: query.meta?.errorToastTitle,
  });
}

/**
 * {@link QueryClient} `mutationCache` 전역 `onError`에서 API 실패 Toast를 표시한다.
 */
export function showGlobalMutationErrorToast(
  error: Error,
  _variables: unknown,
  _context: unknown,
  mutation: Mutation<unknown, unknown, unknown, unknown>,
): void {
  if (mutation.meta?.suppressGlobalErrorToast) return;
  notifyApiError(error, {
    dedupeKey: mutationDedupeKey(mutation),
    title: mutation.meta?.errorToastTitle,
  });
}
