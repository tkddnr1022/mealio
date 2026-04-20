import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import { FlatRow } from "@/components/ui/FlatRow";
import { Toggle } from "@/components/ui/Toggle";

const figmaWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/FlatRow",
  component: FlatRow,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof FlatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToggles: Story = {
  name: "Toggle 배치",
  render: (args) => (
    <FlatRow {...args}>
      <Toggle selected label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected label="Label" />
    </FlatRow>
  ),
};
