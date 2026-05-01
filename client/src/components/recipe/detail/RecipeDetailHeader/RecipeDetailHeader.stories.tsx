import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { RecipeDetailHeader } from "@/components/recipe";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,23rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Detail/RecipeDetailHeader",
  component: RecipeDetailHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    category: "한식",
    title: "비빔밥",
    description:
      "한국의 대표적인 건강식으로, 다양한 나물과 고기, 계란을 넣어 비벼 먹는 전통 요리입니다.",
  },
} satisfies Meta<typeof RecipeDetailHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
