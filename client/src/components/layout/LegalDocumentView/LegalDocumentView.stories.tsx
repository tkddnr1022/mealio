import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  LegalDocumentView,
  LegalSection,
} from '@/components/layout/LegalDocumentView';

const mobileShell: Decorator = (Story) => (
  <div className="mx-auto flex h-[640px] w-full max-w-[400px] flex-col overflow-hidden border border-border-subtle bg-background-primary shadow-md">
    <Story />
  </div>
);

const sampleBody = (
  <>
    <LegalSection title="1. 안내">
      <p className="m-0">
        텍스트 중심 고지·안내 페이지의 기본 레이아웃 예시입니다.
      </p>
    </LegalSection>
    <LegalSection title="2. 유의사항">
      <ul className="m-0 list-disc space-y-1 pl-5">
        <li>Navbar는 로고 없이 뒤로가기만 표시합니다.</li>
        <li>본문은 섹션 단위로 스크롤됩니다.</li>
      </ul>
    </LegalSection>
  </>
);

const meta = {
  title: 'Layout/LegalDocumentView',
  component: LegalDocumentView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [mobileShell],
  args: {
    title: '이용약관',
    effectiveDate: '2026년 7월 23일',
    children: sampleBody,
  },
} satisfies Meta<typeof LegalDocumentView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  name: '기본 (시행일 포함)',
} satisfies Story;

export const WithoutEffectiveDate = {
  name: '시행일 없음 (도움말형)',
  args: {
    title: '도움말',
    effectiveDate: undefined,
  },
} satisfies Story;
