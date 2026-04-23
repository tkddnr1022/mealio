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

const DEFAULT_MESSAGES: readonly ChatConversationMessage[] = [
  {
    id: "m1",
    role: "user",
    message: "비빔밥 레시피 추천해줘.",
    timestamp: "2026-04-24T10:31:00+09:00",
  },
  {
    id: "m2",
    role: "assistant",
    message: "비빔밥을 맛있게 만들려면 봄동을 활용하는 것이 좋습니다. 아래 추천 레시피를 참고해보세요!",
    timestamp: "2026-04-24T10:31:00+09:00",
  },
  {
    id: "m3",
    role: "user",
    message: "고마워!",
    timestamp: "2026-04-24T10:32:00+09:00",
  },
  {
    id: "m4",
    role: "assistant",
    message: "천만에요! 다른 궁금한 점이 있으시면 언제든 물어보세요.",
    timestamp: "2026-04-24T10:32:00+09:00",
  },
];

export function ChatConversation({
  className = "",
  messages = DEFAULT_MESSAGES,
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
