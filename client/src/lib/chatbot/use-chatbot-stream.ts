'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api/error';
import type {
  ChatbotStreamEvent,
  ChatbotToolCallStatus,
  SendChatbotMessageRequest,
  SuggestedRecipe,
} from '@/lib/types/chatbot';
import { CHATBOT_STREAM_EVENT_TYPES } from '@/lib/types/chatbot';

import { streamChatbotMessage, type ChatbotStreamOptions } from './sse-client';

/**
 * 챗봇 스트리밍 훅.
 *
 * - `sendMessage(message)` 호출 시 SSE 구독을 시작하고, 부분 응답(`chunk`)을 누적해 `text`로 노출한다.
 * - `done` 이벤트에서 `conversationId`·`suggestedRecipes`를 업데이트하고 상태를 `done`으로 전환한다.
 * - `error` 이벤트 또는 네트워크 예외는 `error` 상태로 전환하며 {@link ApiError}를 보관한다.
 * - 컴포넌트 언마운트 시 진행 중인 스트림을 abort하여 메모리·커넥션 누수를 방지한다.
 * - 동일 인스턴스에서 메시지를 연속 전송하면 이전 스트림을 abort하고 새로 시작한다.
 *
 * 계약·UI 규칙: `agent/frontend/guidelines/frontend_development_guidelines.md` §2.2,
 * `agent/backend/spec/backend_architecture_spec_producer.md` §1.2.
 */

export type ChatbotStreamStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface ToolCallState {
  functionName: string;
  status: ChatbotToolCallStatus;
  arguments?: string;
}

export interface ChatbotStreamState {
  status: ChatbotStreamStatus;
  /** 현재 응답 turn의 누적 텍스트 (chunk 이벤트 data 연결) */
  text: string;
  conversationId: string | null;
  suggestedRecipes: SuggestedRecipe[];
  /** 진행 중인 function call 상태(도구 호출 UI 표시용) */
  activeToolCalls: ToolCallState[];
  error: ApiError | null;
}

export interface UseChatbotStreamOptions {
  /** 이어서 대화할 기존 conversationId */
  conversationId?: string;
  /**
   * 각 이벤트 수신 시 호출되는 리스너. 디버깅·로깅·분석 용도.
   * 상태 업데이트와 별개로 동작한다.
   */
  onEvent?: (event: ChatbotStreamEvent) => void;
  /** 테스트·커스텀 인증 컨텍스트용 */
  stream?: ChatbotStreamOptions;
}

export interface UseChatbotStreamResult extends ChatbotStreamState {
  sendMessage: (message: string) => Promise<void>;
  /** 진행 중인 스트림 중단 (상태는 'idle'로 복귀) */
  cancel: () => void;
  /** 누적 텍스트·에러·도구 호출 상태 초기화 (conversationId 유지) */
  reset: () => void;
}

const INITIAL_STATE: ChatbotStreamState = {
  status: 'idle',
  text: '',
  conversationId: null,
  suggestedRecipes: [],
  activeToolCalls: [],
  error: null,
};

export function useChatbotStream(
  options: UseChatbotStreamOptions = {},
): UseChatbotStreamResult {
  const { conversationId: initialConversationId, onEvent, stream } = options;

  const [state, setState] = useState<ChatbotStreamState>(() => ({
    ...INITIAL_STATE,
    conversationId: initialConversationId ?? null,
  }));

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const stateConversationIdRef = useRef<string | null>(
    initialConversationId ?? null,
  );
  useEffect(() => {
    stateConversationIdRef.current = state.conversationId;
  }, [state.conversationId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const safeSet = useCallback(
    (updater: (prev: ChatbotStreamState) => ChatbotStreamState) => {
      if (!mountedRef.current) return;
      setState(updater);
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    safeSet((prev) =>
      prev.status === 'streaming' ? { ...prev, status: 'idle' } : prev,
    );
  }, [safeSet]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    safeSet((prev) => ({
      ...INITIAL_STATE,
      conversationId: prev.conversationId,
    }));
  }, [safeSet]);

  const sendMessage = useCallback(
    async (message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const startConversationId = stateConversationIdRef.current ?? undefined;

      safeSet((prev) => ({
        ...prev,
        status: 'streaming',
        text: '',
        suggestedRecipes: [],
        activeToolCalls: [],
        error: null,
      }));

      const params: SendChatbotMessageRequest = {
        message,
        conversationId: startConversationId,
      };

      try {
        const iterator = streamChatbotMessage(params, {
          ...stream,
          signal: controller.signal,
        });
        for await (const event of iterator) {
          if (!mountedRef.current || controller.signal.aborted) break;
          onEventRef.current?.(event);
          applyEvent(safeSet, event);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const apiError = ApiError.fromUnknown(error);
        safeSet((prev) => ({ ...prev, status: 'error', error: apiError }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [safeSet, stream],
  );

  return {
    ...state,
    sendMessage,
    cancel,
    reset,
  };
}

function applyEvent(
  setState: (updater: (prev: ChatbotStreamState) => ChatbotStreamState) => void,
  event: ChatbotStreamEvent,
): void {
  switch (event.type) {
    case CHATBOT_STREAM_EVENT_TYPES.CHUNK:
      setState((prev) => ({ ...prev, text: prev.text + event.data }));
      return;
    case CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL:
      setState((prev) => ({
        ...prev,
        activeToolCalls: mergeToolCall(prev.activeToolCalls, event.data),
      }));
      return;
    case CHATBOT_STREAM_EVENT_TYPES.DONE:
      setState((prev) => ({
        ...prev,
        status: 'done',
        conversationId: event.data.conversationId,
        suggestedRecipes: event.data.suggestedRecipes ?? [],
      }));
      return;
    case CHATBOT_STREAM_EVENT_TYPES.ERROR:
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: new ApiError({
          status: 0,
          message: event.data.message,
          code: 'CHATBOT_STREAM_ERROR',
        }),
      }));
      return;
  }
}

function mergeToolCall(
  current: ToolCallState[],
  incoming: ToolCallState,
): ToolCallState[] {
  const index = current.findIndex(
    (t) => t.functionName === incoming.functionName,
  );
  if (index === -1) return [...current, incoming];
  const next = current.slice();
  next[index] = { ...next[index], ...incoming };
  return next;
}
