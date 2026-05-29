import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { RecipeNutritionCard } from '@/components/recipe/detail/RecipeNutritionCard';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Detail/RecipeNutritionCard',
  component: RecipeNutritionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    nutrition: {
      calories: 220,
      carbohydrates: 3,
      protein: 14,
      fat: 17,
      sodium: 99,
    },
  },
} satisfies Meta<typeof RecipeNutritionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
