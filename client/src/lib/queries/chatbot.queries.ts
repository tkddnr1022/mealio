'use client';

/**
 * 챗봇 대화 목록·상세 React Query 훅.
 *
 * - {@link useConversationListInfinite}: 커서 기반 대화 목록 infinite 조회
 * - {@link useConversationDetail}: 단일 대화 히스토리 조회
 * - {@link invalidateChatbotAfterStreamDone}: SSE `done` 후 목록·상세·유저 캐시 무효화
 *
 * SSE 스트리밍은 React Query 범위 밖으로 `useChatbotStream`(§5.5)에서 처리한다.
 */

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type QueryClient,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { getConversationHistory, getConversationList } from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import type {
  ConversationHistory,
  ConversationList,
  ConversationListQuery,
} from '@/lib/types/chatbot';

import { userQueries } from './user.queries';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const chatbotQueries = {
  all: ['chatbot'] as const,
  conversations: () => [...chatbotQueries.all, 'conversations'] as const,
  conversationListInfinite: (params: Omit<ConversationListQuery, 'cursor'>) =>
    [...chatbotQueries.conversations(), 'list', 'infinite', params] as const,
  conversationDetail: (conversationId: string) =>
    [...chatbotQueries.conversations(), 'detail', conversationId] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── SSE 완료 후 캐시 무효화 ───────────────────────────────────────────────────

export function invalidateChatbotAfterStreamDone(
  qc: QueryClient,
  opts: { conversationId: string | null; invalidateUser?: boolean },
): void {
  if (opts.conversationId) {
    void qc.invalidateQueries({
      queryKey: chatbotQueries.conversationDetail(opts.conversationId),
    });
  }
  void qc.invalidateQueries({
    queryKey: [...chatbotQueries.conversations(), 'list'],
  });
  if (opts.invalidateUser !== false) {
    void qc.invalidateQueries({ queryKey: userQueries.me() });
  }
}

// ─── 훅 ───────────────────────────────────────────────────────────────────────

/**
 * 커서 기반 Infinite 조회. `nextCursor`가 null이면 마지막 페이지로 간주한다.
 */
export function useConversationListInfinite(
  params: Omit<ConversationListQuery, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      ConversationList,
      Error,
      InfiniteData<ConversationList>,
      ReturnType<typeof chatbotQueries.conversationListInfinite>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useInfiniteQuery({
    queryKey: chatbotQueries.conversationListInfinite(params),
    queryFn: ({ pageParam }) =>
      getConversationList({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    ...QUERY_CACHE.chatbot,
    ...rest,
    meta: {
      errorToastTitle: '대화 목록을 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useConversationDetail(
  conversationId: string | null | undefined,
  options?: QueryOpts<ConversationHistory>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  const enabled =
    rest.enabled ??
    (typeof conversationId === 'string' && conversationId.length > 0);
  return useQuery<ConversationHistory, Error>({
    queryKey: chatbotQueries.conversationDetail(conversationId ?? ''),
    queryFn: () => getConversationHistory(conversationId as string),
    ...QUERY_CACHE.chatbot,
    ...rest,
    enabled,
    meta: {
      errorToastTitle: '대화를 불러오지 못했어요',
      ...metaOption,
    },
  });
}
