import type { HTMLAttributes } from 'react';
import type { ConversationListItem } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import {
  ChatCard,
} from '@/components/chatbot/list/ChatCard';

export interface ChatListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  chats: readonly ConversationListItem[];
  getTitle?: (chat: ConversationListItem) => string | undefined;
  getLastMessage?: (chat: ConversationListItem) => string | undefined;
  cardClassName?: string;
}

export function ChatList({
  className = '',
  chats,
  getTitle,
  getLastMessage,
  cardClassName = '',
  ...rest
}: ChatListProps) {
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
            lastMessage={getLastMessage?.(chat)}
            className={cardClassName}
          />
        );
      })}
    </div>
  );
}
