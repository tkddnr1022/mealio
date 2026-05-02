import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search, X } from "lucide-react";
import { fn } from "storybook/test";

import { Input } from "@/components/ui/Input";
import { buildAriaLabel } from "@/lib/utils/a11y";

const narrowWidth: Decorator = (Story) => (
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

export const Empty = {
  name: "기본",
  decorators: [narrowWidth],
} satisfies Story;

export const Filled = {
  name: "값 있음",
  decorators: [narrowWidth],
  args: {
    defaultValue: "입력된 텍스트",
  },
} satisfies Story;

export const Disabled = {
  name: "비활성",
  decorators: [narrowWidth],
  args: {
    disabled: true,
  },
} satisfies Story;

export const WithStartAdornment = {
  name: "왼쪽 아이콘",
  decorators: [narrowWidth],
  args: {
    placeholder: "검색어를 입력해 주세요",
    startAdornment: (
      <Search className="size-full style-text-placeholder" strokeWidth={2} />
    ),
  },
} satisfies Story;

export const WithEndClearButton = {
  name: "오른쪽 클리어 버튼",
  decorators: [narrowWidth],
  args: {
    defaultValue: "지울 수 있는 값",
    endAdornment: (
      <button
        type="button"
        aria-label={buildAriaLabel("button", "지우기")}
        className="inline-flex size-5 items-center justify-center style-text-placeholder"
      >
        <X className="size-full" strokeWidth={2} aria-hidden />
      </button>
    ),
  },
} satisfies Story;

export const NoFocusWithinRing = {
  name: "focus-within 링 없음",
  decorators: [narrowWidth],
  args: {
    focusWithinRing: false,
    placeholder: "상위가 포커스 링 처리",
  },
} satisfies Story;
