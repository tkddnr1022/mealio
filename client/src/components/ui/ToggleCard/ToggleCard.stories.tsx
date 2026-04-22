import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";

import { ToggleCard } from "@/components/ui/ToggleCard";
import { Toggle } from "@/components/ui/Toggle";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/ToggleCard",
  component: ToggleCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    heading: "Heading",
  },
} satisfies Meta<typeof ToggleCard>;

export default meta;
type Story = StoryObj<typeof meta>;
type ToggleCardStoryArgs = ComponentProps<typeof ToggleCard>;

export const Default: Story = {
  render: (args: ToggleCardStoryArgs) => (
    <ToggleCard {...args}>
      <Toggle selected label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected label="Label" />
    </ToggleCard>
  ),
};

export const CustomItems: Story = {
  name: "커스텀 토글 목록",
  render: (args: ToggleCardStoryArgs) => (
    <ToggleCard {...args}>
      <Toggle selected label="한식" />
      <Toggle selected={false} label="양식" />
      <Toggle selected={false} label="중식" />
      <Toggle selected={false} label="일식" />
      <Toggle selected={false} label="분식" />
      <Toggle selected label="비건" />
    </ToggleCard>
  ),
};
