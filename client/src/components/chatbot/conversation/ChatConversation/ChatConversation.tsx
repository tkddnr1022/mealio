import type { HTMLAttributes } from 'react';
import type { ConversationMessage, SuggestedRecipe } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import { ChatConversationRow } from '@/components/chatbot/conversation/ChatConversationRow';
import { SuggestedRecipeSlider } from '@/components/chatbot/conversation/SuggestedRecipeSlider';

export type ChatConversationMessage = Readonly<{
  id: string;
  role: 'assistant' | 'user';
  message: ConversationMessage['message'];
  timestamp: ConversationMessage['createdAt'];
  /** 이 assistant/응답 메시지 직후에 추천 레시피 슬라이더를 붙일 때(스트림 done·RAG 결과 등) */
  suggestedRecipes?: readonly SuggestedRecipe[];
}>;

export interface ChatConversationProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  messages?: readonly ChatConversationMessage[];
}

export function ChatConversation({
  className = '',
  messages = [],
  ...rest
}: ChatConversationProps) {
  return (
    <section
      className={cn('flex w-full flex-col gap-4 overflow-hidden', className)}
      data-name="ChatConversation"
      {...rest}
    >
      {messages.map((message) => (
        <div key={message.id} className="flex w-full flex-col gap-4">
          <ChatConversationRow
            role={message.role}
            bubbleProps={{
              message: message.message,
              timestamp: message.timestamp,
            }}
          />
          {message.suggestedRecipes && message.suggestedRecipes.length > 0 ? (
            <SuggestedRecipeSlider items={message.suggestedRecipes} />
          ) : null}
        </div>
      ))}
    </section>
  );
}
