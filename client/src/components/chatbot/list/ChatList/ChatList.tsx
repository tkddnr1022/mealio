import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { ChatCard, type ChatCardProps } from "@/components/chatbot/list/ChatCard";

export type ChatListItem = ChatCardProps;

export interface ChatListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
chats: readonly ChatListItem[];
cardClassName?: string;
}

export function ChatList({
  className = "",
  chats,
  cardClassName = "",
  ...rest
}: ChatListProps) {
  return (
    <div
      className={cn("flex w-full flex-col gap-4", className)}
      data-name="ChatList"
      {...rest}
    >
      {chats.map((chat) => {
        const { className: itemClassName = "", ...chatProps } = chat;
        return (
          <ChatCard
            key={chatProps.conversationId}
            {...chatProps}
            className={cn(cardClassName, itemClassName)}
          />
        );
      })}
    </div>
  );
}
