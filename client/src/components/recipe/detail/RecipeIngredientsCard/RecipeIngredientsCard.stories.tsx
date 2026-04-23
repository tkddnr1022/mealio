import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { RecipeIngredientsCard } from "@/components/recipe";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Detail/RecipeIngredientsCard",
  component: RecipeIngredientsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    title: "재료",
    ingredients: [
      { name: "밥", quantity: "2공기" },
      { name: "소고기", quantity: "150g" },
    ],
  },
} satisfies Meta<typeof RecipeIngredientsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MoreItems: Story = {
  args: {
    ingredients: [
      { name: "밥", quantity: "2공기" },
      { name: "소고기", quantity: "150g" },
      { name: "고추장", quantity: "1큰술" },
      { name: "참기름", quantity: "1작은술" },
    ],
  },
};
