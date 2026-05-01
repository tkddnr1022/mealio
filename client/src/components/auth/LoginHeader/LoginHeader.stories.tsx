import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginHeader } from "./LoginHeader";

const meta = {
  title: "Auth/LoginHeader",
  component: LoginHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
