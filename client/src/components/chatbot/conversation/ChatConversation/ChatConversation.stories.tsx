import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { SuggestedRecipe } from '@/lib/types/chatbot';
import { ChatConversation } from '@/components/chatbot/conversation/ChatConversation';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)] bg-background-primary py-4">
    <Story />
  </div>
);

const sampleSuggestedRecipes: readonly SuggestedRecipe[] = [
  {
    id: 1,
    title: '비빔밥',
    categoryId: 10,
    categoryName: '한식',
    imageUrl: null,
    cookTime: 30,
    difficulty: 2,
  },
  {
    id: 2,
    title: '김치볶음밥',
    categoryId: 10,
    categoryName: '한식',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
    cookTime: 15,
    difficulty: 1,
  },
];

const meta = {
  title: 'Chatbot/Conversation/ChatConversation',
  component: ChatConversation,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof ChatConversation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    messages: [
      {
        id: 'm1',
        role: 'user',
        message: '비빔밥 레시피 추천해줘.',
        timestamp: '2026-04-24T10:31:00+09:00',
      },
      {
        id: 'm2',
        role: 'assistant',
        message:
          '비빔밥을 맛있게 만들려면 봄동을 활용하는 것이 좋습니다. 아래 추천 레시피를 참고해보세요!',
        timestamp: '2026-04-24T10:31:00+09:00',
        suggestedRecipes: sampleSuggestedRecipes,
      },
      {
        id: 'm3',
        role: 'user',
        message: '고마워!',
        timestamp: '2026-04-24T10:32:00+09:00',
      },
      {
        id: 'm4',
        role: 'assistant',
        message: '천만에요! 다른 궁금한 점이 있으시면 언제든 물어보세요.',
        timestamp: '2026-04-24T10:32:00+09:00',
      },
    ],
  },
};

export const WithoutSuggestions: Story = {
  args: {
    messages: [
      {
        id: 'm1',
        role: 'user',
        message: '비빔밥 레시피 추천해줘.',
        timestamp: '2026-04-24T10:31:00+09:00',
      },
      {
        id: 'm2',
        role: 'assistant',
        message: '비빔밥을 맛있게 만들려면 봄동을 활용하는 것이 좋습니다.',
        timestamp: '2026-04-24T10:31:00+09:00',
      },
    ],
  },
};
