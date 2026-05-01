import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { SuggestedRecipeSlider } from "@/components/chatbot/conversation/SuggestedRecipeSlider";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw,25rem)] py-4">
    <Story />
  </div>
);

const imageA =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&h=320&fit=crop";
const imageB =
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=320&h=320&fit=crop";
const imageC =
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=320&h=320&fit=crop";
const baseItems = [
  {
    id: "recipe-1",
    title: "비빔밥",
    imageUrl: imageA,
    tags: [{ label: "15분" }, { label: "쉬움" }, { label: "2인분" }],
  },
  {
    id: "recipe-2",
    title: "김치볶음밥",
    imageUrl: imageB,
    tags: [{ label: "20분" }, { label: "쉬움" }, { label: "2인분" }],
  },
] as const;

const meta = {
  title: "Chatbot/Conversation/SuggestedRecipeSlider",
  component: SuggestedRecipeSlider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof SuggestedRecipeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoCards = {
  args: {
    items: baseItems,
  },
} satisfies Story;

export const ThreeCards = {
  args: {
    items: [
      ...baseItems,
      {
        id: "recipe-3",
        title: "닭갈비",
        imageUrl: imageC,
        tags: [{ label: "30분" }, { label: "보통" }, { label: "3인분" }],
      },
    ],
  },
} satisfies Story;
