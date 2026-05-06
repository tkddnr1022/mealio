import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps } from 'react';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';

const figmaMobileFrame: Decorator = (Story) => (
  <div className="mx-auto flex h-[640px] w-full max-w-[400px] flex-col border border-border-subtle bg-background-primary shadow-md">
    <Story />
  </div>
);

const meta = {
  title: 'Layout/MainContent',
  component: MainContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
} satisfies Meta<typeof MainContent>;

export default meta;

type Story = StoryObj<typeof meta>;
type MainContentStoryArgs = ComponentProps<typeof MainContent>;

export const Empty = {
  name: '빈 영역 (Figma 프레임 400×640)',
  decorators: [figmaMobileFrame],
} satisfies Story;

export const WithPlaceholder = {
  name: '플레이스홀더 콘텐츠',
  decorators: [figmaMobileFrame],
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <div className="style-text-secondary">
        <p className="typo-body-regular">본문이 여기 들어갑니다.</p>
      </div>
    </MainContent>
  ),
} satisfies Story;

export const Scrollable = {
  name: '스크롤 (긴 목록)',
  decorators: [figmaMobileFrame],
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <ul className="divide-y divide-border-subtle px-4 py-2">
        {Array.from({ length: 24 }, (_, i) => (
          <li key={i} className="py-3 typo-body-regular style-text-primary">
            레시피 카드 영역 {i + 1}
          </li>
        ))}
      </ul>
    </MainContent>
  ),
} satisfies Story;

export const NoPadding = {
  name: '패딩 없음 (XY 풀블리드)',
  decorators: [figmaMobileFrame],
  args: { paddingX: false, paddingY: false },
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <div className="bg-background-surface px-4 py-3 typo-body-regular style-text-primary">
        `paddingX={false}` · `paddingY={false}`이면 기본 px-4/py-6이 빠집니다.
      </div>
    </MainContent>
  ),
} satisfies Story;

export const PaddingXOff = {
  name: '가로만 풀블리드',
  decorators: [figmaMobileFrame],
  args: { paddingX: false, paddingY: true },
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <div className="h-24 w-full bg-primary-default/10 typo-body-regular style-text-primary">
        좌우는 끝까지, 세로는 `py-6` 유지.
      </div>
    </MainContent>
  ),
} satisfies Story;

export const WithNavbarShell = {
  name: 'Navbar + MainContent (앱 셸)',
  decorators: [
    ((Story) => (
      <div className="mx-auto flex min-h-screen w-full max-w-[400px] flex-col bg-background-primary">
        <Navbar variant="Empty" />
        <Story />
      </div>
    )) satisfies Decorator,
  ],
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <div>
        <h2 className="typo-h2">오늘의 추천</h2>
        <p className="mt-2 typo-body-regular style-text-secondary">
          상단 Navbar 아래 영역이 본문으로 채워집니다.
        </p>
      </div>
    </MainContent>
  ),
} satisfies Story;

export const Centered = {
  name: '중앙 정렬 (`centered`)',
  decorators: [figmaMobileFrame],
  args: { centered: true },
  render: (args: MainContentStoryArgs) => (
    <MainContent {...args}>
      <div className="w-full max-w-[280px] rounded-xl border border-border-subtle bg-background-surface p-4 text-center shadow-sm">
        <p className="typo-body-regular style-text-primary">중앙 정렬된 카드</p>
        <p className="typo-caption-regular mt-2 style-text-caption">
          `centered`가 true면 내부 스택에 `justify-center items-center`가
          적용됩니다.
        </p>
      </div>
    </MainContent>
  ),
} satisfies Story;
