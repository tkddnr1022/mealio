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
    title: null,
    updatedAt: '2026-04-23T10:00:00+09:00',
  },
  {
    conversationId: 'chat-2',
    title: null,
    updatedAt: '2026-04-22T08:30:00+09:00',
  },
  {
    conversationId: 'chat-3',
    title: null,
    updatedAt: '2026-04-21T12:00:00+09:00',
  },
];

const titleMap = new Map<string, string>([
  ['chat-1', '김치찌개 레시피 추천'],
  ['chat-2', '다이어트 식단 문의'],
  ['chat-3', '아이 반찬 추천'],
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
  },
} satisfies Meta<typeof ChatList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
