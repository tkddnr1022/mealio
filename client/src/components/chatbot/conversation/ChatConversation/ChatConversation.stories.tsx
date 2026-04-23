import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatConversation } from "@/components/chatbot/conversation/ChatConversation";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)] bg-background-primary py-4">
    <Story />
  </div>
);

const meta = {
  title: "Chatbot/Conversation/ChatConversation",
  component: ChatConversation,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof ChatConversation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSuggestions: Story = {
  args: {
    suggestedRecipes: [],
  },
};
