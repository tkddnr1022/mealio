import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ConversationListItem } from '@/lib/types/chatbot';
import { ChatList } from '@/components/chatbot/list/ChatList';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleChats: readonly ConversationListItem[] = [
  {
    conversationId: 'chat-1',
    lastMessageAt: '2026-04-23T10:00:00+09:00',
  },
  {
    conversationId: 'chat-2',
    lastMessageAt: '2026-04-22T08:30:00+09:00',
  },
  {
    conversationId: 'chat-3',
    lastMessageAt: '2026-04-21T12:00:00+09:00',
  },
];

const titleMap = new Map<string, string>([
  ['chat-1', '김치찌개 레시피 추천'],
  ['chat-2', '다이어트 식단 문의'],
  ['chat-3', '아이 반찬 추천'],
]);

const lastMessageMap = new Map<string, string>([
  ['chat-1', '김치찌개를 맛있게 끓이려면 묵은지를 사용하는 것이 좋습니다.'],
  ['chat-2', '단백질이 풍부한 닭가슴살 샐러드를 추천드립니다.'],
  ['chat-3', '영양가 높은 계란말이와 시금치나물을 추천합니다.'],
]);

const meta = {
  title: 'Chatbot/List/ChatList',
  component: ChatList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    chats: sampleChats,
    getTitle: (chat) => titleMap.get(chat.conversationId),
    getLastMessage: (chat) => lastMessageMap.get(chat.conversationId),
  },
} satisfies Meta<typeof ChatList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
