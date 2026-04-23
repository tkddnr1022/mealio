import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, type DateInput } from "@/lib/utils/date";

export type ChatBubbleRole = "assistant" | "user";

export type ChatBubbleProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    role?: ChatBubbleRole;
    message?: string;
    timestamp?: DateInput;
  }
>;

export function ChatBubble({
  className = "",
  role = "assistant",
  message = "Message",
  timestamp = new Date(),
  ...rest
}: ChatBubbleProps) {
  const isUser = role === "user";
  const formattedTimestamp = formatRelativeTime(timestamp);

  return (
    <div
      className={cn(
        "flex w-auto max-w-[80%] flex-col items-start gap-2 overflow-hidden px-4 py-3 shadow-(--semantic-shadow-md)",
        isUser
          ? "rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-2xl bg-primary-default style-text-button-primary"
          : "rounded-tl-lg rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-background-surface",
        className,
      )}
      data-name="ChatBubble"
      data-role={role}
      {...rest}
    >
      <p
        className={cn(
          "w-full typo-body-regular whitespace-pre-wrap wrap-break-word",
          isUser ? "style-text-button-primary" : "style-text-primary",
        )}
      >
        {message}
      </p>
      <span className={cn("typo-small", isUser ? "style-text-button-primary" : "style-text-caption")}>
        {formattedTimestamp}
      </span>
    </div>
  );
}
