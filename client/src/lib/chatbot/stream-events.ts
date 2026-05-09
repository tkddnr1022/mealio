/**
 * 챗봇 SSE 스트림 타입 가드 · 파서.
 *
 * 타입 정의는 `@/lib/types/chatbot`에 단일 원천으로 존재한다.
 * 본 파일은 다음만 담당한다:
 * - 타입 가드 (`isChunkEvent` 등)
 * - 파싱 유틸 (`parseStreamEvent`, `createSseFrameParser`, `extractDataPayload`)
 *
 * 계약: `agent/backend/spec/backend_architecture_spec_producer.md` §1.2,
 * 실제 정의: `server/shared/src/types/events/chatbot-stream-event.event.ts`.
 */

import type {
  ChatbotStreamChunkEvent,
  ChatbotStreamDoneEvent,
  ChatbotStreamErrorEvent,
  ChatbotStreamEvent,
  ChatbotStreamToolCallEvent,
} from '@/lib/types/chatbot';
import {
  CHATBOT_STREAM_EVENT_TYPES,
  CHATBOT_TOOL_CALL_STATUS,
} from '@/lib/types/chatbot';

export function isChunkEvent(
  event: ChatbotStreamEvent,
): event is ChatbotStreamChunkEvent {
  return event.type === CHATBOT_STREAM_EVENT_TYPES.CHUNK;
}

export function isDoneEvent(
  event: ChatbotStreamEvent,
): event is ChatbotStreamDoneEvent {
  return event.type === CHATBOT_STREAM_EVENT_TYPES.DONE;
}

export function isErrorEvent(
  event: ChatbotStreamEvent,
): event is ChatbotStreamErrorEvent {
  return event.type === CHATBOT_STREAM_EVENT_TYPES.ERROR;
}

export function isToolCallEvent(
  event: ChatbotStreamEvent,
): event is ChatbotStreamToolCallEvent {
  return event.type === CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL;
}

/**
 * 단일 SSE data 페이로드(JSON 문자열)를 {@link ChatbotStreamEvent}로 파싱한다.
 * 알 수 없는 type·파싱 실패 시 null을 반환하며, 호출부에서 조용히 무시하거나 로깅한다.
 */
export function parseStreamEvent(raw: string): ChatbotStreamEvent | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.type !== 'string') return null;

  switch (obj.type) {
    case CHATBOT_STREAM_EVENT_TYPES.CHUNK:
      return typeof obj.data === 'string'
        ? { type: CHATBOT_STREAM_EVENT_TYPES.CHUNK, data: obj.data }
        : null;
    case CHATBOT_STREAM_EVENT_TYPES.DONE:
      return isDoneEventShape(obj.data)
        ? { type: CHATBOT_STREAM_EVENT_TYPES.DONE, data: obj.data }
        : null;
    case CHATBOT_STREAM_EVENT_TYPES.ERROR:
      return isErrorEventShape(obj.data)
        ? { type: CHATBOT_STREAM_EVENT_TYPES.ERROR, data: obj.data }
        : null;
    case CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL:
      return isToolCallEventShape(obj.data)
        ? { type: CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL, data: obj.data }
        : null;
    default:
      return null;
  }
}

function isDoneEventShape(
  data: unknown,
): data is ChatbotStreamDoneEvent['data'] {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.conversationId !== 'string') return false;
  if (d.message !== undefined && typeof d.message !== 'string') {
    return false;
  }
  if (d.suggestedRecipes !== undefined && !Array.isArray(d.suggestedRecipes)) {
    return false;
  }
  return true;
}

function isErrorEventShape(
  data: unknown,
): data is ChatbotStreamErrorEvent['data'] {
  if (!data || typeof data !== 'object') return false;
  return typeof (data as Record<string, unknown>).message === 'string';
}

function isToolCallEventShape(
  data: unknown,
): data is ChatbotStreamToolCallEvent['data'] {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.functionName !== 'string') return false;
  if (
    d.status !== CHATBOT_TOOL_CALL_STATUS.START &&
    d.status !== CHATBOT_TOOL_CALL_STATUS.COMPLETE
  ) {
    return false;
  }
  if (d.arguments !== undefined && typeof d.arguments !== 'string') {
    return false;
  }
  return true;
}

/**
 * SSE 스트림 텍스트 버퍼에서 완전한 이벤트(`\n\n` 구분) 프레임을 뽑아내는 증분 파서.
 *
 * 사용 예:
 * ```ts
 * const parser = createSseFrameParser();
 * for await (const chunk of stream) {
 *   for (const frame of parser.push(chunk)) {
 *     // frame = "data: {...}\ndata: ..." 블록
 *   }
 * }
 * ```
 */
export function createSseFrameParser(): {
  push: (text: string) => string[];
  flush: () => string[];
} {
  let buffer = '';
  return {
    push(text: string): string[] {
      buffer += text;
      const frames: string[] = [];
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        frames.push(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
      return frames;
    },
    flush(): string[] {
      if (!buffer.trim()) return [];
      const remaining = buffer;
      buffer = '';
      return [remaining];
    },
  };
}

/**
 * SSE 프레임(여러 줄)에서 `data:` 라인만 모아 하나의 페이로드 문자열로 합친다.
 * `:`로 시작하는 코멘트 라인, `event:`/`id:`/`retry:` 등 비-data 필드는 무시한다.
 * `data:` 라인이 여러 개면 개행으로 연결한다(SSE 스펙).
 */
export function extractDataPayload(frame: string): string | null {
  const lines = frame.split(/\r?\n/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const field = line.slice(0, colon);
    if (field !== 'data') continue;
    const value = line.slice(colon + 1);
    dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
  }
  return dataLines.length > 0 ? dataLines.join('\n') : null;
}
