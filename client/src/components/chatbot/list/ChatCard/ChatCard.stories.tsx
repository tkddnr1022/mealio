import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatCard } from "@/components/chatbot/list/ChatCard";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Chatbot/List/ChatCard",
  component: ChatCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    title: "김치찌개 레시피 추천",
    timestamp: new Date("2026-04-23T10:00:00+09:00"),
    lastMessage: "김치찌개를 맛있게 끓이려면 묵은지를 사용하는 것이 좋습니다.",
  },
} satisfies Meta<typeof ChatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
