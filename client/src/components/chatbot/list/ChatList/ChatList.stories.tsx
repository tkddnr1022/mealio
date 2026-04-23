import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ChatListItem, ChatList } from "@/components/chatbot/list/ChatList";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleChats: readonly ChatListItem[] = [
  {
    id: "chat-1",
    title: "김치찌개 레시피 추천",
    timestamp: new Date("2026-04-23T10:00:00+09:00"),
    lastMessage: "김치찌개를 맛있게 끓이려면 묵은지를 사용하는 것이 좋습니다.",
  },
  {
    id: "chat-2",
    title: "다이어트 식단 문의",
    timestamp: new Date("2026-04-22T08:30:00+09:00"),
    lastMessage: "단백질이 풍부한 닭가슴살 샐러드를 추천드립니다.",
  },
  {
    id: "chat-3",
    title: "아이 반찬 추천",
    timestamp: new Date("2026-04-21T12:00:00+09:00"),
    lastMessage: "영양가 높은 계란말이와 시금치나물을 추천합니다.",
  },
];

const meta = {
  title: "Chatbot/List/ChatList",
  component: ChatList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    chats: sampleChats,
  },
} satisfies Meta<typeof ChatList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
