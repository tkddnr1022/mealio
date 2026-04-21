import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { fn } from "storybook/test";

import { Input } from "@/components/ui/Input";

const narrowWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,23rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    placeholder: "Placeholder",
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "기본",
  decorators: [narrowWidth],
};

export const Filled: Story = {
  name: "값 있음",
  decorators: [narrowWidth],
  args: {
    defaultValue: "입력된 텍스트",
  },
};

export const Disabled: Story = {
  name: "비활성",
  decorators: [narrowWidth],
  args: {
    disabled: true,
  },
};

export const WithStartAdornment: Story = {
  name: "왼쪽 아이콘",
  decorators: [narrowWidth],
  args: {
    placeholder: "검색어를 입력해 주세요",
    startAdornment: (
      <Search className="size-full style-text-placeholder" strokeWidth={2} />
    ),
  },
};

export const WithEndClearButton: Story = {
  name: "오른쪽 클리어 버튼",
  decorators: [narrowWidth],
  args: {
    defaultValue: "지울 수 있는 값",
    endAdornment: (
      <button
        type="button"
        aria-label="지우기"
        className="inline-flex size-5 items-center justify-center style-text-placeholder"
      >
        <X className="size-full" strokeWidth={2} aria-hidden />
      </button>
    ),
  },
};

export const NoFocusWithinRing: Story = {
  name: "focus-within 링 없음",
  decorators: [narrowWidth],
  args: {
    focusWithinRing: false,
    placeholder: "상위가 포커스 링 처리",
  },
};
