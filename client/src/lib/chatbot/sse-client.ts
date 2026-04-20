import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/error';
import { parseErrorResponse } from '@/lib/api/error.parser';
import { httpClient, HttpClient } from '@/lib/api/http-client';
import type {
  ChatbotStreamEvent,
  SendChatbotMessageRequest,
} from '@/lib/types/chatbot';

import {
  createSseFrameParser,
  extractDataPayload,
  parseStreamEvent,
} from './stream-events';

/**
 * 챗봇 SSE 스트리밍 클라이언트.
 *
 * 백엔드: `POST /api/v1/chatbot/messages` (text/event-stream 응답, `data: {JSON}\n\n` 프레임).
 * 구현:
 * - {@link HttpClient.raw}로 POST 후 `response.body`(ReadableStream) 를 `TextDecoder`로
 *   UTF-8 증분 디코딩 → `\n\n` 경계로 프레임을 잘라 `data:` 라인을 모은 뒤
 *   {@link parseStreamEvent}로 {@link ChatbotStreamEvent}로 변환한다.
 * - `AbortSignal`로 외부 취소 가능. 호출자가 signal을 주지 않으면 내부 컨트롤러로 관리.
 * - 재연결은 호출자(예: `useChatbotStream`)가 `done`/`error` 수신 후 필요 시 재시도한다.
 *   (SSE 표준 `retry:` 필드는 사용하지 않으며, 서버도 Last-Event-ID 기반 재개를 지원하지 않음)
 */

export interface ChatbotStreamOptions {
  /** 외부 취소 신호. 전달되지 않으면 내부 AbortController가 생성된다 */
  signal?: AbortSignal;
  /** 테스트·커스텀 인증 컨텍스트용 HttpClient 주입 (기본: 전역 httpClient) */
  client?: HttpClient;
}

/**
 * 챗봇 메시지를 전송하고 스트림 이벤트를 비동기 이터레이터로 반환한다.
 *
 * 예:
 * ```ts
 * for await (const event of streamChatbotMessage({ message })) {
 *   if (event.type === 'chunk') setText(prev => prev + event.data);
 *   if (event.type === 'done') setConversationId(event.data.conversationId);
 * }
 * ```
 *
 * - 네트워크·HTTP 오류는 {@link ApiError}로 throw된다.
 * - SSE `error` 이벤트 수신은 예외가 아니라 yield되므로 호출부에서 분기 처리한다.
 * - `AbortSignal.abort()`가 호출되면 이터레이션이 DOMException('AbortError')으로 종료된다.
 */
export async function* streamChatbotMessage(
  params: SendChatbotMessageRequest,
  options: ChatbotStreamOptions = {},
): AsyncGenerator<ChatbotStreamEvent, void, void> {
  const client = options.client ?? httpClient;

  const response = await client.raw(
    'POST',
    API_ENDPOINTS.chatbot.messages,
    {
      body: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      signal: options.signal,
    },
  );

  if (!response.ok) {
    throw await parseErrorResponse(
      response,
      response.headers.get('X-Correlation-Id') ?? '',
    );
  }

  if (!response.body) {
    throw new ApiError({
      status: response.status,
      message: 'SSE response body is empty',
      code: 'SSE_EMPTY_BODY',
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const framer = createSseFrameParser();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const frame of framer.push(text)) {
        const event = toEvent(frame);
        if (event) yield event;
      }
    }
    const tail = decoder.decode();
    if (tail) {
      for (const frame of framer.push(tail)) {
        const event = toEvent(frame);
        if (event) yield event;
      }
    }
    for (const frame of framer.flush()) {
      const event = toEvent(frame);
      if (event) yield event;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // 이미 닫힌 스트림은 무시
    }
  }
}

function toEvent(frame: string): ChatbotStreamEvent | null {
  const payload = extractDataPayload(frame);
  if (!payload) return null;
  return parseStreamEvent(payload);
}
