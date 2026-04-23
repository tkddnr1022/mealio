import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { MiniTagsRow } from "@/components/ui/MiniTagsRow";

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,15rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/MiniTagsRow",
  component: MiniTagsRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [rowWidth],
} satisfies Meta<typeof MiniTagsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
