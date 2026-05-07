'use client';

/**
 * 챗봇 대화 목록·상세 React Query 훅.
 *
 * - `useConversationList`: 단일 페이지 조회. 커서 페이지네이션이 필요한 경우
 *   {@link useConversationListInfinite}을 사용한다.
 * - `useConversationDetail`: 단일 대화 히스토리 조회. 챗봇 SSE 전송이 끝난 뒤
 *   `useChatbotStream`의 `done` 이벤트에서 이 쿼리를 invalidate하면 최신 메시지가
 *   자동으로 반영된다.
 *
 * SSE 스트리밍은 React Query 범위 밖으로 `useChatbotStream`(§5.4)에서 처리한다.
 */

import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getConversationHistory,
  getConversationList,
} from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type {
  Conversation,
  ConversationList,
  ConversationListQuery,
} from '@/lib/types/chatbot';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const chatbotQueries = {
  all: ['chatbot'] as const,
  conversations: () => [...chatbotQueries.all, 'conversations'] as const,
  conversationList: (params: Omit<ConversationListQuery, 'cursor'>) =>
    [...chatbotQueries.conversations(), 'list', params] as const,
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

// ─── 훅 ───────────────────────────────────────────────────────────────────────

export function useConversationList(
  params: ConversationListQuery = {},
  options?: QueryOpts<ConversationList>,
) {
  const { cursor, ...rest } = params;
  return useQuery<ConversationList, Error>({
    queryKey: chatbotQueries.conversationList(rest),
    queryFn: () => getConversationList({ ...rest, cursor }),
    ...QUERY_CACHE.chatbot,
    ...options,
  });
}

/**
 * 커서 기반 Infinite 조회. `nextCursor`가 null이면 마지막 페이지로 간주한다.
 */
export function useConversationListInfinite(
  params: Omit<ConversationListQuery, 'cursor'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      ConversationList,
      Error,
      ConversationList,
      ReturnType<typeof chatbotQueries.conversationListInfinite>,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >,
) {
  return useInfiniteQuery({
    queryKey: chatbotQueries.conversationListInfinite(params),
    queryFn: ({ pageParam }) =>
      getConversationList({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    ...QUERY_CACHE.chatbot,
    ...options,
  });
}

export function useConversationDetail(
  conversationId: string | null | undefined,
  options?: QueryOpts<Conversation>,
) {
  const enabled =
    options?.enabled ??
    (typeof conversationId === 'string' && conversationId.length > 0);
  return useQuery<Conversation, Error>({
    queryKey: chatbotQueries.conversationDetail(conversationId ?? ''),
    queryFn: () => getConversationHistory(conversationId as string),
    ...QUERY_CACHE.chatbot,
    ...options,
    enabled,
  });
}
