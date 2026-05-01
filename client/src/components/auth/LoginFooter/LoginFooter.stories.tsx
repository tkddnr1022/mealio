import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginFooter } from "./LoginFooter";

const meta = {
  title: "Auth/LoginFooter",
  component: LoginFooter,
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
} satisfies Meta<typeof LoginFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
