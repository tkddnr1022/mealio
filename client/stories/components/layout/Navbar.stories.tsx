import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Navbar } from "../../../components/layout/Navbar";

const variantOrder = [
  "Empty",
  "AddOnly",
  "BackOnly",
  "AddWithBack",
  "EngageWithBack",
] as const;

const meta = {
  title: "Layout/Navbar",
  component: Navbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    title: "Navbar",
    variant: "Empty",
    onBack: fn(),
    onAdd: fn(),
    onLike: fn(),
    onShare: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: [...variantOrder],
      description:
        "Empty → AddOnly → BackOnly → AddWithBack → EngageWithBack",
    },
  },
} satisfies Meta<typeof Navbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VariantEmpty: Story = {
  name: "Variant / Empty",
  args: { variant: "Empty" },
};

export const VariantAddOnly: Story = {
  name: "Variant / AddOnly",
  args: { variant: "AddOnly" },
};

export const VariantBackOnly: Story = {
  name: "Variant / BackOnly",
  args: { variant: "BackOnly" },
};

export const VariantAddWithBack: Story = {
  name: "Variant / AddWithBack",
  args: { variant: "AddWithBack" },
};

export const VariantEngageWithBack: Story = {
  name: "Variant / EngageWithBack",
  args: { variant: "EngageWithBack" },
};

export const LongTitle: Story = {
  args: {
    title: "토마토와 바질로 만드는 카프레제 샐러드",
  },
};

