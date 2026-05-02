import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ChatComposer } from "@/components/chatbot/conversation/ChatComposer";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Chatbot/Conversation/ChatComposer",
  component: ChatComposer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    onValueChange: fn(),
    onSubmitMessage: fn(),
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty = {
  args: {
    value: "",
  },
} satisfies Story;

export const Filled = {
  args: {
    value: "한식 레시피 추천해줘",
  },
} satisfies Story;
