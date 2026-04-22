import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { Flame, UsersRound } from "lucide-react";
import { FlatTag } from "@/components/ui/FlatTag";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,8rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/FlatTag",
  component: FlatTag,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    accent: false,
  },
} satisfies Meta<typeof FlatTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accent: Story = {
  args: {
    accent: true,
  },
};

export const CustomLeftIcon: Story = {
  args: {
    leftIcon: <Flame className="size-4 p-px" strokeWidth={2} aria-hidden />,
  },
};

export const WithTrailing: Story = {
  args: {
    trailing: (
      <UsersRound className="size-4 p-px" strokeWidth={2} aria-hidden />
    ),
  },
};
