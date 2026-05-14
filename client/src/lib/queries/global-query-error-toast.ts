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
 * {@link QueryClient} 생성 시 `queryCache`에 넘기는 전역 `onError`.
 */
export function globalQueryCacheOnError(
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
 * {@link QueryClient} 생성 시 `mutationCache`에 넘기는 전역 `onError`.
 */
export function globalMutationCacheOnError(
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
