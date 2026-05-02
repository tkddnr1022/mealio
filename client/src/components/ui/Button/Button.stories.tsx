import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  type ButtonSize,
  type ButtonVariant,
  Button,
} from "@/components/ui/Button";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,26rem)]">
    <Story />
  </div>
);

const buttonVariantOptions = ["primary", "secondary"] as const satisfies readonly ButtonVariant[];
const buttonSizeOptions = ["large", "medium"] as const satisfies readonly ButtonSize[];

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    variant: "primary",
    size: "large",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: buttonVariantOptions,
    },
    size: {
      control: "select",
      options: buttonSizeOptions,
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground = {} satisfies Story;

export const PrimaryLargeDefault = {
  name: "Primary / Large",
  args: {
    variant: "primary",
    size: "large",
  },
} satisfies Story;

export const PrimaryMediumDefault = {
  name: "Primary / Medium",
  args: {
    variant: "primary",
    size: "medium",
  },
} satisfies Story;

export const PrimaryLargeInactive = {
  name: "Primary / Large / Disabled",
  args: {
    variant: "primary",
    size: "large",
    disabled: true,
  },
} satisfies Story;

export const PrimaryMediumInactive = {
  name: "Primary / Medium / Disabled",
  args: {
    variant: "primary",
    size: "medium",
    disabled: true,
  },
} satisfies Story;

export const SecondaryLargeDefault = {
  name: "Secondary / Large",
  args: {
    variant: "secondary",
    size: "large",
  },
} satisfies Story;

export const SecondaryMediumDefault = {
  name: "Secondary / Medium",
  args: {
    variant: "secondary",
    size: "medium",
  },
} satisfies Story;

export const InternalNavPrimary = {
  name: "내부 링크(Primary)",
  args: {
    variant: "primary",
    size: "large",
    label: "레시피 홈으로",
    href: "/recipe",
  },
} satisfies Story;

export const ExternalAnchorSecondary = {
  name: "외부 링크(Secondary)",
  args: {
    variant: "secondary",
    size: "medium",
    label: "이용약관",
    href: "https://example.com/terms",
  },
} satisfies Story;
