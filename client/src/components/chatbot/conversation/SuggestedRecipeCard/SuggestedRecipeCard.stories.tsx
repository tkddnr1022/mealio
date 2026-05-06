import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { SuggestedRecipe } from '@/lib/types/chatbot';
import { SuggestedRecipeCard } from '@/components/chatbot/conversation/SuggestedRecipeCard';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22rem)]">
    <Story />
  </div>
);

const sampleImage =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&h=320&fit=crop';
const sampleRecipe: SuggestedRecipe = {
  id: 1,
  title: '비빔밥',
  categoryId: 10,
  categoryName: '한식',
  matchScore: 92,
};

const meta = {
  title: 'Chatbot/Conversation/SuggestedRecipeCard',
  component: SuggestedRecipeCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    recipe: sampleRecipe,
    imageUrl: sampleImage,
  },
} satisfies Meta<typeof SuggestedRecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const LongTitle = {
  args: {
    recipe: {
      ...sampleRecipe,
      title: '제철 채소를 듬뿍 넣은 고소한 참기름 향 비빔밥',
    },
  },
} satisfies Story;
