import { Flame, UsersRound } from "lucide-react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardTag } from "@/components/ui/CardTag";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,7rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/CardTag",
  component: CardTag,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
  },
} satisfies Meta<typeof CardTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FlameIcon: Story = {
  args: {
    label: "Difficulty",
    leftIcon: <Flame className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
};

export const UsersIcon: Story = {
  args: {
    label: "Servings",
    leftIcon: (
      <UsersRound className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />
    ),
  },
};
