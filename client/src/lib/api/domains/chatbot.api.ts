/**
 * 챗봇 대화 목록·상세 조회 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * - GET /api/v1/chatbot/conversations          → {@link getConversationList}
 * - GET /api/v1/chatbot/conversations/:id      → {@link getConversationHistory}
 *
 * SSE 스트리밍 메시지 전송(`POST /api/v1/chatbot/messages`)은
 * `client/src/lib/chatbot/sse-client.ts`의 `streamChatbotMessage`를 사용한다.
 *
 * 도메인 타입은 `@/lib/types/chatbot`에서 정의한다.
 */

import { httpClient, type RequestOptions } from '../http-client';
import { objectToQuery } from '../query';
import { API_ENDPOINTS } from '../endpoints';
import type {
  Conversation,
  ConversationList,
  ConversationListQuery,
} from '@/lib/types/chatbot';

/**
 * 대화 목록을 조회한다 (커서 기반 페이지네이션, 최신 순).
 */
export function getConversationList(
  params: ConversationListQuery = {},
  fetchOptions?: RequestOptions,
): Promise<ConversationList> {
  return httpClient.get<ConversationList>(API_ENDPOINTS.chatbot.conversations, {
    ...fetchOptions,
    query: objectToQuery(params),
  });
}

/**
 * 특정 대화의 메시지 히스토리를 조회한다.
 * 존재하지 않는 대화 ID는 백엔드에서 404를 반환하며 `ApiError`로 throw된다.
 */
export function getConversationHistory(
  conversationId: string,
  fetchOptions?: RequestOptions,
): Promise<Conversation> {
  return httpClient.get<Conversation>(
    API_ENDPOINTS.chatbot.conversationDetail(conversationId),
    fetchOptions,
  );
}
