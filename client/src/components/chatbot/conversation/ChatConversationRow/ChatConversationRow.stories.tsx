import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatConversationRow } from "@/components/chatbot";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Chatbot/Conversation/ChatConversationRow",
  component: ChatConversationRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    role: "assistant",
    bubbleProps: {
      message: "Message",
      timestamp: new Date("2026-04-23T10:00:00+09:00"),
    },
  },
} satisfies Meta<typeof ChatConversationRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant = {} satisfies Story;

export const User = {
  args: {
    role: "user",
  },
} satisfies Story;
