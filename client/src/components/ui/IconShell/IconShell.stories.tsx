import { Flame } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  IconShell,
  type IconShellSize,
  type IconShellVariant,
} from "@/components/ui/IconShell";

const variantOptions = [
  "primary",
  "accent",
  "muted",
  "secondary",
] as const satisfies readonly IconShellVariant[];
const sizeOptions = [
  "small",
  "medium",
  "large",
  "xlarge",
] as const satisfies readonly IconShellSize[];

const meta = {
  title: "UI/IconShell",
  component: IconShell,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    variant: "primary",
    size: "small",
  },
  argTypes: {
    variant: {
      control: "select",
      options: variantOptions,
    },
    size: {
      control: "select",
      options: sizeOptions,
    },
  },
} satisfies Meta<typeof IconShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground = {} satisfies Story;

export const VariantSizeMatrix = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      {variantOptions.map((variant) =>
        sizeOptions.map((size) => (
          <IconShell key={`${variant}-${size}`} variant={variant} size={size} />
        )),
      )}
    </div>
  ),
} satisfies Story;

export const CustomIconSlot = {
  args: {
    variant: "accent",
    size: "large",
    icon: <Flame className="size-6" strokeWidth={2} aria-hidden />,
  },
} satisfies Story;
