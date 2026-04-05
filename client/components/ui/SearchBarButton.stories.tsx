import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { fn } from "storybook/test";

import { SearchBarButton } from "./SearchBarButton";

const narrowWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Layout/SearchBarButton",
  component: SearchBarButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof SearchBarButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "기본",
  decorators: [narrowWidth],
};

export const CustomPlaceholder: Story = {
  name: "플레이스홀더",
  decorators: [narrowWidth],
  args: {
    searchBarProps: {
      placeholder: "재료로 검색 (예: 달걀)",
    },
  },
};

export const Disabled: Story = {
  name: "비활성",
  decorators: [narrowWidth],
  args: {
    disabled: true,
  },
};
