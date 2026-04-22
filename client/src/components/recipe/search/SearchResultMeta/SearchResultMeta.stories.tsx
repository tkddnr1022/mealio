import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchResultMeta } from "@/components/recipe/search/SearchResultMeta";

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: "Recipe/Search/SearchResultMeta",
  component: SearchResultMeta,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [rowWidth],
  args: {
    totalCount: 1,
  },
} satisfies Meta<typeof SearchResultMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
