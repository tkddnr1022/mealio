import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import {
  Navbar,
  type NavbarVariant,
} from "@/components/layout/Navbar";

const variantOrder = [
  "Empty",
  "AddOnly",
  "BackOnly",
  "AddWithBack",
  "EngageWithBack",
] as const satisfies readonly NavbarVariant[];

const meta = {
  title: "Layout/Navbar",
  component: Navbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
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

export const VariantEmpty = {
  name: "Variant / Empty",
  args: { variant: "Empty" },
} satisfies Story;

export const VariantAddOnly = {
  name: "Variant / AddOnly",
  args: { variant: "AddOnly" },
} satisfies Story;

export const VariantBackOnly = {
  name: "Variant / BackOnly",
  args: { variant: "BackOnly" },
} satisfies Story;

export const VariantAddWithBack = {
  name: "Variant / AddWithBack",
  args: { variant: "AddWithBack" },
} satisfies Story;

export const VariantEngageWithBack = {
  name: "Variant / EngageWithBack",
  args: { variant: "EngageWithBack" },
} satisfies Story;
