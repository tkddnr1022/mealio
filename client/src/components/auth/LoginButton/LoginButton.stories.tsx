import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginButton } from "./LoginButton";

const meta = {
  title: "Auth/LoginButton",
  component: LoginButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[240px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Kakao: Story = {
  args: { provider: "kakao" },
};

export const Naver: Story = {
  args: { provider: "naver" },
};

export const Google: Story = {
  args: { provider: "google" },
};
