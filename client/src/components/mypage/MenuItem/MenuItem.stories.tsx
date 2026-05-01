import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MenuItem } from "@/components/mypage/MenuItem/index";

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
    label: "내 레시피 관리",
  },
} satisfies Meta<typeof MenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BorderFalse: Story = {
  name: "border=false",
  args: {
    border: false,
  },
};

export const BorderTrue: Story = {
  name: "border=true",
  args: {
    border: true,
  },
};
