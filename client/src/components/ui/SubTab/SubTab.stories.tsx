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

export const Unselected = {
  name: "selected=false",
} satisfies Story;

export const Selected = {
  name: "selected=true",
  args: {
    selected: true,
  },
} satisfies Story;
