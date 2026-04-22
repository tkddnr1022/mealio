import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaginationDot } from "@/components/ui/PaginationDot";

const row: Decorator = (Story) => (
  <div className="flex items-center gap-2 py-4">
    <Story />
  </div>
);

const meta = {
  title: "UI/PaginationDot",
  component: PaginationDot,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [row],
} satisfies Meta<typeof PaginationDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  name: "비활성",
  args: {
    active: false,
  },
};

export const Active: Story = {
  name: "활성",
  args: {
    active: true,
  },
};

/** 인디케이터 행 사용 예시 (3번째 활성) */
export const RowExample: Story = {
  name: "행 예시",
  render: () => (
    <div className="flex items-center gap-2" role="group" aria-label="슬라이드 위치">
      <PaginationDot aria-hidden />
      <PaginationDot aria-hidden />
      <PaginationDot active aria-current="true" />
      <PaginationDot aria-hidden />
      <PaginationDot aria-hidden />
    </div>
  ),
};
