import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { RecipeIngredientRow } from "@/components/recipe";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,20.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Detail/RecipeIngredientRow",
  component: RecipeIngredientRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    name: "밥",
    quantity: "2공기",
  },
} satisfies Meta<typeof RecipeIngredientRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
