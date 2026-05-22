'use client';

import { Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChatComposer } from '@/components/chatbot/conversation/ChatComposer';
import {
  ChatConversation,
  type ChatConversationMessage,
} from '@/components/chatbot/conversation/ChatConversation';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Alert } from '@/components/ui/Alert';
import { AuthStatus, useAuth } from '@/lib/auth/auth-context';
import { getStreamProgressLabel } from '@/lib/chatbot/stream-progress-label';
import { useChatbotStream } from '@/lib/chatbot/use-chatbot-stream';
import {
  chatbotQueries,
  useConversationDetail,
} from '@/lib/queries/chatbot.queries';
import {
  AnalyticsEventProps,
  AnalyticsEvents,
} from '@/lib/observability/analytics-events';
import { trackEvent } from '@/lib/observability/analytics';
import { notifyApiError } from '@/lib/toast';
import type { ConversationMessage, SuggestedRecipe } from '@/lib/types/chatbot';

const EMPTY_TITLE = '챗봇에게 물어보세요';
const EMPTY_MESSAGE =
  '오늘 먹고 싶은 음식, 내 재료로 만들 수 있는 레시피를 추천해드려요';
const PENDING_USER_MESSAGE_ID = 'pending-user';
const PENDING_ASSISTANT_MESSAGE_ID = 'pending-assistant';
/**
 * 신규 대화 진입용 sentinel 라우트 값.
 *
 * `/chatbot/new` 로 진입하면 페이지는 `conversationId` 를 비워 둔 채 동작하고,
 * 첫 메시지 전송 시 백엔드가 새 대화를 생성한다(`agent/common/openapi_spec.yaml`
 * `POST /api/v1/chatbot/messages` — `conversationId` 미전송 시 신규 생성).
 * `done` 이벤트로 받은 실제 `conversationId` 로 URL을 즉시 동기화한다.
 */
const NEW_CONVERSATION_SENTINEL = 'new';

interface PendingUserMessage {
  text: string;
  timestamp: string;
}

function toDisplayMessages(
  conversationId: string | null,
  messages: readonly ConversationMessage[],
  streamSuggestedRecipes: readonly SuggestedRecipe[],
): ChatConversationMessage[] {
  const visible = messages.filter((message) => message.role !== 'system');
  // 마지막 assistant 응답에만 추천 레시피 슬라이더를 노출한다.
  const lastAssistantIndex = (() => {
    for (let i = visible.length - 1; i >= 0; i -= 1) {
      if (visible[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return visible.map((message, index) => {
    // 히스토리: 각 assistant 턴마다 서버가 내려준 suggestedRecipes를 그 메시지에 붙인다.
    // (마지막 assistant만 허용하면, 그 뒤에 후속 user/assistant 턴이 있을 때 추천이 UI에서 사라진다.)
    const fromHistory =
      message.role === 'assistant' &&
      message.suggestedRecipes &&
      message.suggestedRecipes.length > 0
        ? message.suggestedRecipes
        : undefined;
    const fromStream =
      index === lastAssistantIndex &&
      message.role === 'assistant' &&
      streamSuggestedRecipes.length > 0
        ? streamSuggestedRecipes
        : undefined;

    return {
      id: `${conversationId ?? 'conversation'}-history-${index}`,
      role: message.role as 'assistant' | 'user',
      message: message.message,
      timestamp: message.createdAt,
      suggestedRecipes: fromHistory ?? fromStream,
    };
  });
}

export function ChatbotConversationClientPage() {
  const currentUrl = usePathname();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status, refresh } = useAuth();

  const rawConversationId = params?.id;
  // sentinel('new') 또는 빈 값은 "아직 conversationId가 없는 상태"로 정규화한다.
  const conversationId =
    typeof rawConversationId === 'string' &&
    rawConversationId.length > 0 &&
    rawConversationId !== NEW_CONVERSATION_SENTINEL
      ? rawConversationId
      : null;

  const { data: conversation } = useConversationDetail(conversationId, {
    meta: {
      currentUrl,
    },
  });
  const stream = useChatbotStream({
    conversationId: conversationId ?? undefined,
  });

  const [composerValue, setComposerValue] = useState('');
  const [pendingUserMessage, setPendingUserMessage] =
    useState<PendingUserMessage | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const streamErrorToastSigRef = useRef<string | null>(null);

  const scrollConversationToBottom = useCallback(() => {
    const el = conversationEndRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }, []);

  const scrollConversationToBottomAfterLayout = useCallback(() => {
    const el = conversationEndRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'end', behavior: 'smooth' });
      });
    });
  }, []);

  const isStreaming = stream.status === 'streaming';
  const isDone = stream.status === 'done';
  const streamedAssistantText = stream.text;
  const isCreditExhausted =
    stream.isCreditDepleted ||
    (status === AuthStatus.Authenticated &&
      user !== null &&
      user.creditBalance <= 0);

  const composerDisabled = stream.status !== 'streaming' && isCreditExhausted;

  // 서버 히스토리에 이미 같은 user 메시지가 반영되었다면 낙관적 pending은 숨긴다.
  // (effect로 setState하지 않고 렌더 시점에 파생값으로 결정해 cascading render를 피한다.)
  const visiblePendingUserMessage = useMemo(() => {
    if (!pendingUserMessage) return null;
    if (!isDone) return pendingUserMessage;
    const persisted = (conversation?.messages ?? []).some(
      (message) =>
        message.role === 'user' && message.message === pendingUserMessage.text,
    );
    return persisted ? null : pendingUserMessage;
  }, [pendingUserMessage, isDone, conversation?.messages]);

  const historyMessages = useMemo(
    () =>
      toDisplayMessages(
        conversationId,
        conversation?.messages ?? [],
        // 낙관적 pending 메시지가 노출 중이면 추천 레시피는 pending 응답에만 붙인다.
        visiblePendingUserMessage ? [] : stream.suggestedRecipes,
      ),
    [
      conversation?.messages,
      conversationId,
      visiblePendingUserMessage,
      stream.suggestedRecipes,
    ],
  );

  const messages = useMemo<ChatConversationMessage[]>(() => {
    const list: ChatConversationMessage[] = [...historyMessages];

    if (visiblePendingUserMessage) {
      list.push({
        id: PENDING_USER_MESSAGE_ID,
        role: 'user',
        message: visiblePendingUserMessage.text,
        timestamp: visiblePendingUserMessage.timestamp,
      });

      if (isStreaming || isDone) {
        const progressLabel = getStreamProgressLabel({
          status: stream.status,
          text: streamedAssistantText,
          hasReceivedFirstStreamEvent: stream.hasReceivedFirstStreamEvent,
          activeToolCalls: stream.activeToolCalls,
        });
        const assistantMessage =
          streamedAssistantText.length > 0
            ? streamedAssistantText
            : (progressLabel ?? '');

        list.push({
          id: PENDING_ASSISTANT_MESSAGE_ID,
          role: 'assistant',
          message: assistantMessage,
          timestamp: visiblePendingUserMessage.timestamp,
          pendingPlaceholder: isStreaming && streamedAssistantText.length === 0,
          assistantStreamAnimating:
            isStreaming && streamedAssistantText.length > 0,
          suggestedRecipes:
            isDone && stream.suggestedRecipes.length > 0
              ? stream.suggestedRecipes
              : undefined,
        });
      }
    }

    return list;
  }, [
    historyMessages,
    visiblePendingUserMessage,
    isStreaming,
    isDone,
    streamedAssistantText,
    stream.status,
    stream.hasReceivedFirstStreamEvent,
    stream.activeToolCalls,
    stream.suggestedRecipes,
  ]);

  const hasConversation = messages.length > 0;

  // 스트리밍 종료 후 새 conversationId가 발급되면 URL을 동기화한다.
  useEffect(() => {
    if (!isDone) return;
    const nextConversationId = stream.conversationId;
    if (!nextConversationId) return;
    if (nextConversationId === conversationId) return;
    router.replace(`/chatbot/${encodeURIComponent(nextConversationId)}`);
  }, [isDone, stream.conversationId, conversationId, router]);

  // 스트리밍이 완료되면 서버 히스토리를 다시 불러와 낙관적 메시지를 정합화한다.
  useEffect(() => {
    if (!isDone) return;
    if (!conversationId) return;
    void queryClient.invalidateQueries({
      queryKey: chatbotQueries.conversationDetail(conversationId),
    });
  }, [isDone, conversationId, queryClient]);

  // 스트림 완료 후 세션 유저(크레딧) 갱신 — composerDisabled의 profileCreditDepleted와 동일 소스
  useEffect(() => {
    if (stream.status !== 'done') return;
    void refresh();
  }, [stream.status, refresh]);

  // 기존 대화 상세 진입 시(마운트·라우트 id 변경 후 히스토리가 있을 때) 최하단으로 스크롤
  useEffect(() => {
    if (!conversationId || !hasConversation) return;
    scrollConversationToBottomAfterLayout();
  }, [conversationId, hasConversation, scrollConversationToBottomAfterLayout]);

  // 메시지 전송 직후(낙관적 UI 반영 뒤) 대화 영역 최하단으로 스크롤
  useEffect(() => {
    if (!pendingUserMessage) return;
    scrollConversationToBottom();
  }, [pendingUserMessage, scrollConversationToBottom]);

  // 스트림 완료 시(추천 레시피 등 레이아웃 확정 후) 최하단으로 스크롤
  useEffect(() => {
    if (stream.status !== 'done') return;
    scrollConversationToBottomAfterLayout();
  }, [stream.status, scrollConversationToBottomAfterLayout]);

  const handleSubmitMessage = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0 || isStreaming || composerDisabled) return;
      setPendingUserMessage({
        text: trimmed,
        timestamp: new Date().toISOString(),
      });
      setComposerValue('');
      trackEvent(AnalyticsEvents.CHATBOT_MESSAGE_SENT, {
        [AnalyticsEventProps.CONVERSATION_ID]: conversationId ?? 'new',
        [AnalyticsEventProps.MESSAGE_LENGTH]: trimmed.length,
        [AnalyticsEventProps.IS_NEW_CONVERSATION]: conversationId === null,
      });
      void stream.sendMessage(trimmed);
    },
    [isStreaming, stream, composerDisabled, conversationId],
  );

  useEffect(() => {
    if (stream.status !== 'error' || !stream.error) {
      streamErrorToastSigRef.current = null;
      return;
    }
    const sig = `${stream.error.code ?? ''}:${stream.error.message}:${stream.error.status}`;
    if (streamErrorToastSigRef.current === sig) return;
    streamErrorToastSigRef.current = sig;

    const retryText = visiblePendingUserMessage?.text;
    notifyApiError(stream.error, {
      title: '챗봇 응답을 받지 못했어요',
      dedupeKey: `chatbot:stream:${conversationId ?? 'new'}:${retryText ?? ''}`,
      action: retryText
        ? {
            label: '다시 시도',
            onAction: () => {
              streamErrorToastSigRef.current = null;
              stream.reset();
              void stream.sendMessage(retryText);
            },
          }
        : undefined,
    });
  }, [stream, visiblePendingUserMessage?.text, conversationId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Navbar
        displayBackButton
        displayTitle={false}
        onBack={() => router.back()}
      />

      <MainContent
        paddingX={!hasConversation}
        centered={!hasConversation}
        scrollEndRef={hasConversation ? conversationEndRef : undefined}
      >
        {hasConversation ? (
          <ChatConversation messages={messages} />
        ) : (
          <InfoScreen
            icon={<Send className="size-8" aria-hidden />}
            title={EMPTY_TITLE}
            message={EMPTY_MESSAGE}
            showButton={false}
          />
        )}
      </MainContent>

      {isCreditExhausted ? (
        <Alert
          variant="warning"
          title="크레딧이 소진되었어요"
          message="남은 크레딧이 없어 메시지를 보낼 수 없어요."
        />
      ) : null}

      <ChatComposer
        value={composerValue}
        onValueChange={setComposerValue}
        onSubmitMessage={handleSubmitMessage}
        disabled={composerDisabled}
      />
    </div>
  );
}
