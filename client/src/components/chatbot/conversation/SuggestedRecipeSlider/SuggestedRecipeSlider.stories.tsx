import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { SuggestedRecipe } from '@/lib/types/chatbot';
import { SuggestedRecipeSlider } from '@/components/chatbot/conversation/SuggestedRecipeSlider';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw,25rem)] py-4">
    <Story />
  </div>
);

const imageA =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&h=320&fit=crop';
const imageB =
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=320&h=320&fit=crop';
const imageC =
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=320&h=320&fit=crop';
const baseItems = [
  {
    id: 1,
    title: '비빔밥',
    categoryId: 10,
    categoryName: '한식',
    cookTime: 30,
    difficulty: 2,
  },
  {
    id: 2,
    title: '김치볶음밥',
    categoryId: 10,
    categoryName: '한식',
    cookTime: 15,
    difficulty: 1,
  },
] satisfies readonly SuggestedRecipe[];

const imageMap = new Map<number, string>([
  [1, imageA],
  [2, imageB],
  [3, imageC],
]);

const meta = {
  title: 'Chatbot/Conversation/SuggestedRecipeSlider',
  component: SuggestedRecipeSlider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof SuggestedRecipeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoCards = {
  args: {
    items: baseItems,
    getImageUrl: (item: SuggestedRecipe) => imageMap.get(item.id),
  },
} satisfies Story;

export const ThreeCards = {
  args: {
    items: [
      ...baseItems,
      {
        id: 3,
        title: '닭갈비',
        categoryId: 10,
        categoryName: '한식',
        cookTime: 45,
        difficulty: 3,
      },
    ],
    getImageUrl: (item: SuggestedRecipe) => imageMap.get(item.id),
  },
} satisfies Story;
