import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { ToastViewport } from '@/components/ui/Toast/ToastViewport';
import type { ToastItem } from '@/lib/toast/toast.types';

const sampleItems: ToastItem[] = [
  {
    id: 'viewport-1',
    variant: 'error',
    title: '요청을 처리하지 못했어요',
    message: '네트워크 연결을 확인해 주세요.',
    durationMs: 0,
  },
];

const meta = {
  title: 'UI/Toast/ToastViewport',
  component: ToastViewport,
  tags: ['autodocs'],
  parameters: {
    /** `fixed` 뷰포트가 캔버스에서 보이도록 전체 화면에 가깝게 둔다 */
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-[200px] w-full bg-background-primary-default p-4">
        <p className="typo-body-regular style-text-secondary mb-4">
          화면 하단 중앙에 토스트 스택이 고정됩니다.
        </p>
        <Story />
      </div>
    ),
  ],
  args: {
    onDismiss: fn(),
    items: sampleItems,
  },
} satisfies Meta<typeof ToastViewport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single = {
  args: {
    items: sampleItems,
  },
} satisfies Story;

export const Multiple = {
  args: {
    items: [
      {
        id: 'm-1',
        variant: 'info',
        title: '안내',
        message: '백그라운드 동기화가 완료되었습니다.',
        durationMs: 0,
      },
      {
        id: 'm-2',
        variant: 'warning',
        title: '크레딧이 부족해요',
        message: '남은 크레딧을 확인해 주세요.',
        durationMs: 0,
      },
      {
        id: 'm-3',
        variant: 'error',
        title: '저장하지 못했어요',
        message: '잠시 후 다시 시도해 주세요.',
        durationMs: 0,
      },
    ],
  },
} satisfies Story;

export const Empty = {
  args: {
    items: [],
  },
} satisfies Story;
