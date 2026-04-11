import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import { RecipeGridCard } from "@/components/ui/RecipeGridCard";

/** Figma 그리드 열 폭에 가깝게 두기 (~170px) */
const gridColumn = (Story: () => ReactNode) => (
  <div className="w-[170px]">
    <Story />
  </div>
);

const meta = {
  title: "UI/RecipeGridCard",
  component: RecipeGridCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [gridColumn],
} satisfies Meta<typeof RecipeGridCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleImage =
  "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop";

export const Default: Story = {
  name: "기본",
  args: {
    imageUrl: sampleImage,
    title: "치킨 카레",
    cookingTime: "45분",
    difficulty: "쉬움",
    servings: "4인분",
    category: "아시안",
  },
};

export const LongTitle: Story = {
  name: "긴 제목",
  args: {
    ...Default.args,
    title:
      "한 입에 녹아드는 부드러운 닭고기와 향신료가 어우러진 정통 스타일 치킨 카레",
  },
};

export const MetaPartial: Story = {
  name: "메타 일부만",
  args: {
    imageUrl: sampleImage,
    title: "토마토 파스타",
    cookingTime: "20분",
    difficulty: "쉬움",
  },
};

export const TitleOnly: Story = {
  name: "제목만",
  args: {
    imageUrl: sampleImage,
    title: "간단 샐러드",
  },
};

