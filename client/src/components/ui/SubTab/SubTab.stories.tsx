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

export const AsInternalLink = {
  name: "내부 링크",
  args: {
    label: "보유 재료",
    selected: true,
    href: "/inventory/ingredients/owned",
    preventLinkNavigation: true,
  },
} satisfies Story;
