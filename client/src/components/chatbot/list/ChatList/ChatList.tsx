import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { ChatCard, type ChatCardProps } from "@/components/chatbot/list/ChatCard";

export type ChatListItem = ChatCardProps;

export type ChatListProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    chats: readonly ChatListItem[];
    cardClassName?: string;
  }
>;

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
      {chats.map((chat, index) => {
        const { className: itemClassName = "", ...chatProps } = chat;
        return (
          <ChatCard
            key={chatProps.id ?? `chat-list-${index}`}
            {...chatProps}
            className={cn(cardClassName, itemClassName)}
          />
        );
      })}
    </div>
  );
}
