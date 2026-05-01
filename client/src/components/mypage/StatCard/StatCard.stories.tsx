import { MessageCircle, Package } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatCard } from "@/components/mypage/StatCard/index";

const meta = {
  title: "Mypage/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "24",
    label: "저장한 레시피",
  },
};

export const Inventory: Story = {
  args: {
    icon: <Package className="size-5" strokeWidth={2} />,
    value: "12",
    label: "보유 재료",
  },
};

export const Chat: Story = {
  args: {
    icon: <MessageCircle className="size-5" strokeWidth={2} />,
    value: "10",
    label: "챗봇 대화",
  },
};
