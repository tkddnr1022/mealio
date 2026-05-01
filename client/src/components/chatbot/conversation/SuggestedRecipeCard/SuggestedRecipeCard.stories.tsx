import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { SuggestedRecipeCard } from "@/components/chatbot/conversation/SuggestedRecipeCard";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22rem)]">
    <Story />
  </div>
);

const sampleImage =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&h=320&fit=crop";

const meta = {
  title: "Chatbot/Conversation/SuggestedRecipeCard",
  component: SuggestedRecipeCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    title: "비빔밥",
    imageUrl: sampleImage,
    tags: [{ label: "15분" }, { label: "쉬움" }, { label: "2인분" }],
  },
} satisfies Meta<typeof SuggestedRecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const LongTitle = {
  args: {
    title: "제철 채소를 듬뿍 넣은 고소한 참기름 향 비빔밥",
  },
} satisfies Story;
