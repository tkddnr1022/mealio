import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { RecipeIngredientsCard } from '@/components/recipe';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Detail/RecipeIngredientsCard',
  component: RecipeIngredientsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    title: '재료',
    ingredients: [
      { id: 1, name: '밥', amount: 2, unit: '공기', isOptional: false },
      { id: 2, name: '소고기', amount: 150, unit: 'g', isOptional: false },
    ],
  },
} satisfies Meta<typeof RecipeIngredientsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const MoreItems = {
  args: {
    ingredients: [
      { id: 1, name: '밥', amount: 2, unit: '공기', isOptional: false },
      { id: 2, name: '소고기', amount: 150, unit: 'g', isOptional: false },
      { id: 3, name: '고추장', amount: 1, unit: '큰술', isOptional: false },
      { id: 4, name: '참기름', amount: 1, unit: '작은술', isOptional: true },
    ],
  },
} satisfies Story;
