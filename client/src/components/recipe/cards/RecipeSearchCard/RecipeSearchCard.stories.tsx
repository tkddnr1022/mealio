import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RecipeSearchCard } from "@/components/recipe";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleImage =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop";

const meta = {
  title: "Recipe/Cards/RecipeSearchCard",
  component: RecipeSearchCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    imageUrl: sampleImage,
    imageAlt: "비빔밥",
    title: "비빔밥",
    summary: "신선한 채소와 고소한 참기름이 어우러진 건강한 한그릇 요리",
    cookingTime: "15분",
    difficulty: "쉬움",
    servings: "2인분",
    isFavorite: false,
    onFavoriteClick: fn(),
  },
} satisfies Meta<typeof RecipeSearchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Favorite: Story = {
  args: {
    isFavorite: true,
  },
};
