import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import RecipeMainPage from "../../app/page";

const mobileCanvas = (Story: () => ReactNode) => (
  <div className="flex min-h-screen w-full justify-center bg-background">
    <div className="w-full max-w-[400px]">
      <Story />
    </div>
  </div>
);

const meta = {
  title: "Pages/RecipeMainPage",
  component: RecipeMainPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile" },
  },
  decorators: [mobileCanvas],
} satisfies Meta<typeof RecipeMainPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "기본 화면",
};
