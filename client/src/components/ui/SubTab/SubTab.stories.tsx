import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SubTab } from "@/components/ui/SubTab";

const meta = {
  title: "UI/SubTab",
  component: SubTab,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    label: "보유 재료",
    selected: false,
  },
} satisfies Meta<typeof SubTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  name: "selected=false",
};

export const Selected: Story = {
  name: "selected=true",
  args: {
    selected: true,
  },
};
