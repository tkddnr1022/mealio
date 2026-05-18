import type { HTMLAttributes } from 'react';
import type { ConversationListItem } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import { ChatCard } from '@/components/chatbot/list/ChatCard';

export interface ChatListProps<
  TChat extends ConversationListItem = ConversationListItem,
> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  className?: string;
  chats: readonly TChat[];
  getTitle?: (chat: TChat) => string | undefined;
  cardClassName?: string;
}

export function ChatList<TChat extends ConversationListItem>({
  className = '',
  chats,
  getTitle,
  cardClassName = '',
  ...rest
}: ChatListProps<TChat>) {
  return (
    <div
      className={cn('flex w-full flex-col gap-4', className)}
      data-name="ChatList"
      {...rest}
    >
      {chats.map((chat) => {
        return (
          <ChatCard
            key={chat.conversationId}
            conversation={chat}
            title={getTitle?.(chat)}
            className={cardClassName}
          />
        );
      })}
    </div>
  );
}
