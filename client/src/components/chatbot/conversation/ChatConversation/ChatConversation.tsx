import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { ChatConversationRow } from "@/components/chatbot/conversation/ChatConversationRow";
import { SuggestedRecipeSlider, type SuggestedRecipeSliderItem } from "@/components/chatbot/conversation/SuggestedRecipeSlider";

export type ChatConversationMessage = Readonly<{
  id: string;
  role: "assistant" | "user";
  message: string;
  timestamp: Date | string | number;
}>;

export type ChatConversationProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    messages?: readonly ChatConversationMessage[];
    suggestedRecipes?: readonly SuggestedRecipeSliderItem[];
  }
>;

export function ChatConversation({
  className = "",
  messages = [],
  suggestedRecipes,
  ...rest
}: ChatConversationProps) {
  return (
    <section
      className={cn("flex w-full flex-col gap-4 overflow-hidden", className)}
      data-name="ChatConversation"
      {...rest}
    >
      {messages.map((message, index) => (
        <div key={message.id} className="flex w-full flex-col gap-4">
          <ChatConversationRow
            role={message.role}
            bubbleProps={{
              message: message.message,
              timestamp: message.timestamp,
            }}
          />
          {index === 1 ? <SuggestedRecipeSlider items={suggestedRecipes} /> : null}
        </div>
      ))}
    </section>
  );
}
