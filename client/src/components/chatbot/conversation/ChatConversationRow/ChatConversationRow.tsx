import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import {
  ChatBubble,
  type ChatBubbleProps,
  type ChatBubbleRole,
} from "@/components/chatbot/conversation/ChatBubble";

export interface ChatConversationRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
role?: ChatBubbleRole;
bubbleProps?: Omit<ChatBubbleProps, "role" | "className">;
}

export function ChatConversationRow({
  className = "",
  role = "assistant",
  bubbleProps,
  ...rest
}: ChatConversationRowProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full flex-col px-4",
        isUser ? "items-end" : "items-start",
        className,
      )}
      data-name="ChatConversationRow"
      data-role={role}
      {...rest}
    >
      <ChatBubble role={role} {...bubbleProps} />
    </div>
  );
}
