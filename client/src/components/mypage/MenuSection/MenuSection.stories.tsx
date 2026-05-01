import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MenuSection } from "@/components/mypage/MenuSection/index";

const meta = {
  title: "Mypage/MenuSection",
  component: MenuSection,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MenuSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: "내 레시피 관리", border: true },
      { label: "계정 설정", border: false },
    ],
  },
};

export const CustomItems: Story = {
  args: {
    items: [
      { label: "공지사항", border: true },
      { label: "고객센터", border: true },
      { label: "로그아웃", border: false },
    ],
  },
};
