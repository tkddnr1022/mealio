import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ChipsRow } from "@/components/ui/ChipsRow";

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/ChipsRow",
  component: ChipsRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [rowWidth],
  args: {
    labels: ["Label", "Label", "Label"],
    onRemoveChip: fn(),
  },
} satisfies Meta<typeof ChipsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
