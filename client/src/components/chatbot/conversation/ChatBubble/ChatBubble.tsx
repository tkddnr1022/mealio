'use client';

import type { HTMLAttributes } from 'react';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils/cn';
import { type DateInput } from '@/lib/utils/date';
import { toChatBubbleTimestampLabel } from '@/components/chatbot/utils/chatbot-format';

export type ChatBubbleRole = 'assistant' | 'user';

export interface ChatBubbleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  role?: ChatBubbleRole;
  message?: string;
  timestamp?: DateInput;
  /** 스트림 placeholder(답변 생성 중·도구 실행 중) — 캡션 톤·스크린 리더 live region */
  pendingPlaceholder?: boolean;
  /**
   * assistant 답변 토큰이 아직 스트리밍 중일 때 Streamdown 생성 애니메이션·캐럿 표시.
   * 진행 문구 전용 `pendingPlaceholder`와는 별개.
   */
  assistantStreamAnimating?: boolean;
}

export function ChatBubble({
  className = '',
  role = 'assistant',
  message,
  timestamp = new Date(),
  pendingPlaceholder = false,
  assistantStreamAnimating = false,
  ...rest
}: ChatBubbleProps) {
  const isUser = role === 'user';
  const formattedTimestamp = toChatBubbleTimestampLabel(timestamp);
  const isPendingAssistantPlaceholder =
    !isUser && pendingPlaceholder && (message?.length ?? 0) > 0;
  const liveRegionProps = isPendingAssistantPlaceholder
    ? { role: 'status' as const, 'aria-live': 'polite' as const }
    : {};

  return (
    <div
      className={cn(
        'flex w-auto max-w-[80%] flex-col items-start gap-2 overflow-hidden px-4 py-3 shadow-(--semantic-shadow-md)',
        isUser
          ? 'rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-2xl bg-primary-default style-text-button-primary'
          : 'rounded-tl-lg rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-background-surface',
        className,
      )}
      data-name="ChatBubble"
      data-role={role}
      {...rest}
    >
      {isUser ? (
        <p
          className={cn(
            'w-full typo-body-regular whitespace-pre-wrap wrap-break-word',
            'style-text-button-primary',
          )}
          {...liveRegionProps}
        >
          {message ?? ''}
        </p>
      ) : (
        <div
          className={cn(
            'w-full wrap-break-word',
            isPendingAssistantPlaceholder && 'style-text-caption animate-pulse',
            !isPendingAssistantPlaceholder && 'style-text-primary',
          )}
          {...liveRegionProps}
        >
          <Streamdown
            className={cn(
              'typo-body-regular max-w-full [&_a]:text-(--ref-color-ext-link) [&_a:hover]:text-(--ref-color-ext-link-hover)',
            )}
            isAnimating={
              assistantStreamAnimating && !isPendingAssistantPlaceholder
            }
          >
            {message ?? ''}
          </Streamdown>
        </div>
      )}
      <span
        className={cn(
          'typo-small',
          isUser ? 'style-text-button-primary' : 'style-text-caption',
        )}
      >
        {formattedTimestamp}
      </span>
    </div>
  );
}
