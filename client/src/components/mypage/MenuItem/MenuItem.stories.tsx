import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SquarePen } from "lucide-react";
import { MenuItem } from "@/components/mypage/MenuItem";

const meta = {
  title: "Mypage/MenuItem",
  component: MenuItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full px-4 bg-background-surface">
        <Story />
      </div>
    ),
  ],
  args: {
    href: "/mypage",
    label: "내 레시피 관리",
    leadingIcon: <SquarePen className="size-5" strokeWidth={2} />,
  },
} satisfies Meta<typeof MenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BorderFalse = {
  name: "border=false",
  args: {
    border: false,
  },
} satisfies Story;

export const BorderTrue = {
  name: "border=true",
  args: {
    border: true,
  },
} satisfies Story;

export const ExternalAnchor = {
  name: "외부·비내부 href(일반 a)",
  args: {
    href: "https://example.com/policy",
    border: false,
  },
} satisfies Story;
