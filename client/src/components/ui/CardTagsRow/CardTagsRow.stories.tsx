import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardTagsRow } from "@/components/ui/CardTagsRow";

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/CardTagsRow",
  component: CardTagsRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [rowWidth],
} satisfies Meta<typeof CardTagsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
