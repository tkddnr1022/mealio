import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import { MainContent } from "../../../components/layout/MainContent";
import { Navbar } from "../../../components/layout/Navbar";

const figmaMobileFrame = (Story: () => ReactNode) => (
  <div className="mx-auto flex h-[640px] w-full max-w-[400px] flex-col border border-border-subtle bg-background shadow-md">
    <Story />
  </div>
);

const meta = {
  title: "Layout/MainContent",
  component: MainContent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
} satisfies Meta<typeof MainContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "빈 영역 (Figma 프레임 400×640)",
  decorators: [figmaMobileFrame],
};

export const WithPlaceholder: Story = {
  name: "플레이스홀더 콘텐츠",
  decorators: [figmaMobileFrame],
  render: (args) => (
    <MainContent {...args}>
      <div className="text-text-secondary">
        <p className="text-body">본문이 여기 들어갑니다.</p>
      </div>
    </MainContent>
  ),
};

export const Scrollable: Story = {
  name: "스크롤 (긴 목록)",
  decorators: [figmaMobileFrame],
  render: (args) => (
    <MainContent {...args}>
      <ul className="divide-y divide-border-subtle px-4 py-2">
        {Array.from({ length: 24 }, (_, i) => (
          <li key={i} className="py-3 text-body text-text-primary">
            레시피 카드 영역 {i + 1}
          </li>
        ))}
      </ul>
    </MainContent>
  ),
};

export const NoPadding: Story = {
  name: "패딩 없음 (XY 풀블리드)",
  decorators: [figmaMobileFrame],
  args: { paddingX: false, paddingY: false },
  render: (args) => (
    <MainContent {...args}>
      <div className="bg-surface px-4 py-3 text-body text-text-primary">
        `paddingX={false}` · `paddingY={false}`이면 기본 px-4/py-6이 빠집니다.
      </div>
    </MainContent>
  ),
};

export const PaddingXOff: Story = {
  name: "가로만 풀블리드",
  decorators: [figmaMobileFrame],
  args: { paddingX: false, paddingY: true },
  render: (args) => (
    <MainContent {...args}>
      <div className="h-24 w-full bg-primary/10 text-body text-text-primary">
        좌우는 끝까지, 세로는 `py-6` 유지.
      </div>
    </MainContent>
  ),
};

export const WithNavbarShell: Story = {
  name: "Navbar + MainContent (앱 셸)",
  decorators: [
    (Story) => (
      <div className="mx-auto flex min-h-screen w-full max-w-[400px] flex-col bg-background">
        <Navbar title="홈" variant="Empty" />
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <MainContent {...args}>
      <div>
        <h2 className="text-h2">오늘의 추천</h2>
        <p className="mt-2 text-body text-text-secondary">
          상단 Navbar 아래 영역이 본문으로 채워집니다.
        </p>
      </div>
    </MainContent>
  ),
};

export const Centered: Story = {
  name: "중앙 정렬 (`centered`)",
  decorators: [figmaMobileFrame],
  args: { centered: true },
  render: (args) => (
    <MainContent {...args}>
      <div className="w-full max-w-[280px] rounded-xl border border-border-subtle bg-surface p-4 text-center shadow-sm">
        <p className="text-body text-text-primary">중앙 정렬된 카드</p>
        <p className="mt-2 text-caption">
          `centered`가 true면 내부 스택에 `justify-center items-center`가 적용됩니다.
        </p>
      </div>
    </MainContent>
  ),
};

