import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { RecipeStepsCard } from "@/components/recipe";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Detail/RecipeStepsCard",
  component: RecipeStepsCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    title: "조리 순서",
    steps: [
      { step: "1", instruction: "첫 번째 조리 단계입니다." },
      { step: "2", instruction: "다음 단계를 진행합니다." },
    ],
  },
} satisfies Meta<typeof RecipeStepsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const LongSteps = {
  args: {
    steps: [
      { step: "1", instruction: "재료를 모두 손질하고 밥을 준비합니다." },
      { step: "2", instruction: "팬에 고기를 볶고 양념을 더해 간을 맞춥니다." },
      { step: "3", instruction: "그릇에 밥과 재료를 담아 완성합니다." },
    ],
  },
} satisfies Story;
