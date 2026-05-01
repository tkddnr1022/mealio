import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginButtonList } from "./LoginButtonList";

const meta = {
  title: "Auth/LoginButtonList",
  component: LoginButtonList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[280px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginButtonList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
