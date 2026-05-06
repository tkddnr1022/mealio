import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { RecipeSummary } from '@/lib/types/recipe';
import { RecipeList } from '@/components/recipe';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleImage =
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop';

const sampleRecipes: readonly RecipeSummary[] = [
  {
    id: 1,
    imageUrl: sampleImage,
    title: '비빔밥',
    description: '신선한 채소와 고소한 참기름이 어우러진 건강한 한그릇 요리',
    difficulty: 2,
    cookTime: 15,
    servings: 2,
    viewCount: 100,
    likeCount: 20,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    imageUrl: sampleImage,
    title: '비빔밥',
    description: '신선한 채소와 고소한 참기름이 어우러진 건강한 한그릇 요리',
    difficulty: 2,
    cookTime: 15,
    servings: 2,
    viewCount: 120,
    likeCount: 30,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

const meta = {
  title: 'Recipe/Lists/RecipeList',
  component: RecipeList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    recipes: sampleRecipes,
  },
} satisfies Meta<typeof RecipeList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const Single = {
  args: {
    recipes: sampleRecipes.slice(0, 1),
  },
} satisfies Story;
