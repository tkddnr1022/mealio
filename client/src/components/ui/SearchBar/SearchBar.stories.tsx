import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { fn } from "storybook/test";

import { Navbar } from "@/components/layout/Navbar";
import { SearchBar } from "@/components/ui/SearchBar";

const narrowWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,23rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    placeholder: "검색어를 입력해 주세요",
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "기본 (빈 값)",
  decorators: [narrowWidth],
};

export const Filled: Story = {
  name: "입력됨",
  decorators: [narrowWidth],
  args: {
    defaultValue: "비빔밥",
  },
};

export const ReadOnlyTrigger: Story = {
  name: "readOnly + tabIndex -1 (헤더·트리거)",
  decorators: [narrowWidth],
  args: {
    readOnly: true,
    tabIndex: -1,
    defaultValue: "비빔밥",
  },
};

export const Disabled: Story = {
  name: "비활성",
  decorators: [narrowWidth],
  args: {
    disabled: true,
  },
};

export const CustomPlaceholder: Story = {
  name: "플레이스홀더 변경",
  decorators: [narrowWidth],
  args: {
    placeholder: "재료로 검색 (예: 달걀)",
  },
};

export const InsideNavbar: Story = {
  name: "Navbar 아래 (레이아웃 참고)",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background-primary">
        <Navbar variant="Empty" />
        <div className="mx-auto w-full max-w-[1200px] px-2 py-4">
          <div className="max-w-md">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
};
