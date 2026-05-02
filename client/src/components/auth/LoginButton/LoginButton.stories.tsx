import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginButton, type LoginButtonProps } from "./LoginButton";

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
} satisfies Meta<LoginButtonProps>;

export default meta;

type Story = StoryObj<LoginButtonProps>;

export const Kakao = {
  args: { provider: "kakao" },
} satisfies Story;

export const Naver = {
  args: { provider: "naver" },
} satisfies Story;

export const Google = {
  args: { provider: "google" },
} satisfies Story;

/** Storybook: OAuth 링크 모드(프로덕션은 LoginButtonList가 buildOAuthEntryUrl 사용) */
export const KakaoAsLink = {
  args: { provider: "kakao", href: "/api/v1/auth/kakao" },
} satisfies Story;
