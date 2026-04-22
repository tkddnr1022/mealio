import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Chip } from "@/components/ui/Chip";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,8.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    onRemove: fn(),
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
