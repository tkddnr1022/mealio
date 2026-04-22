import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchBarCard } from "@/components/recipe/cards/SearchBarCard";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Cards/SearchBarCard",
  component: SearchBarCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    heading: "검색어",
  },
} satisfies Meta<typeof SearchBarCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  name: "입력값 있음",
  args: {
    searchBarProps: {
      defaultValue: "김치찌개",
    },
  },
};
