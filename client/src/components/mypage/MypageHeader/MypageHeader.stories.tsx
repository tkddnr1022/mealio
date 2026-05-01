import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MypageHeader } from "@/components/mypage/MypageHeader/index";

const meta = {
  title: "Mypage/MypageHeader",
  component: MypageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[392px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MypageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  name: "loggedIn=true",
  args: {
    loggedIn: true,
    userProfileProps: {
      nickname: "김레시피",
      email: "recipe@example.com",
    },
  },
};

export const LoggedOut: Story = {
  name: "loggedIn=false",
  args: {
    loggedIn: false,
    userProfileProps: {
      message: "로그인이 필요합니다",
    },
  },
};
