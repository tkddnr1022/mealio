import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { ActionGroup } from "@/components/ui/ActionGroup";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)] border border-border-subtle">
    <Story />
  </div>
);

const meta = {
  title: "UI/ActionGroup",
  component: ActionGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    leftButtonProps: { label: "취소" },
    rightButtonProps: { label: "적용" },
  },
} satisfies Meta<typeof ActionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
