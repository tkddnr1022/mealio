import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatBubble } from "@/components/chatbot/conversation/ChatBubble";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,10rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Chatbot/Conversation/ChatBubble",
  component: ChatBubble,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    role: "assistant",
    message: "Message",
    timestamp: new Date("2026-04-23T10:00:00+09:00"),
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {};

export const User: Story = {
  args: {
    role: "user",
  },
};
