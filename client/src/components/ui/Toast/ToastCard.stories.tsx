import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { ToastCard } from '@/components/ui/Toast/ToastCard';
import type { ToastItem } from '@/lib/toast/toast.types';

function storyItem(overrides: Partial<ToastItem>): ToastItem {
  return {
    id: 'story-toast-1',
    variant: 'error',
    title: '알림',
    durationMs: 0,
    ...overrides,
  };
}

const meta = {
  title: 'UI/Toast/ToastCard',
  component: ToastCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(100vw-2rem,22rem)]">
        <Story />
      </div>
    ),
  ],
  args: {
    onDismiss: fn(),
    item: storyItem({
      variant: 'error',
      title: '요청을 처리하지 못했어요',
      message: '네트워크 연결을 확인해 주세요.',
    }),
  },
} satisfies Meta<typeof ToastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error = {
  args: {
    item: storyItem({
      variant: 'error',
      title: '요청을 처리하지 못했어요',
      message: '일시적인 오류가 발생했습니다.',
    }),
  },
} satisfies Story;

export const Warning = {
  args: {
    item: storyItem({
      variant: 'warning',
      title: '확인이 필요해요',
      message: '입력한 내용을 한 번 더 검토해 주세요.',
    }),
  },
} satisfies Story;

export const Info = {
  args: {
    item: storyItem({
      variant: 'info',
      title: '안내',
      message: '변경 사항은 설정에서 수정할 수 있어요.',
    }),
  },
} satisfies Story;

export const Success = {
  args: {
    item: storyItem({
      variant: 'success',
      title: '저장했어요',
      message: '보관함이 갱신되었습니다.',
    }),
  },
} satisfies Story;

export const TitleOnly = {
  args: {
    item: storyItem({
      variant: 'info',
      title: '제목만 있는 토스트',
      message: undefined,
    }),
  },
} satisfies Story;

export const WithAction = {
  args: {
    item: storyItem({
      variant: 'error',
      title: '챗봇 응답을 받지 못했어요',
      message: '연결 상태를 확인한 뒤 다시 시도해 주세요.',
      action: {
        label: '다시 시도',
        onAction: fn(),
      },
    }),
  },
} satisfies Story;

export const LongMessage = {
  args: {
    item: storyItem({
      variant: 'warning',
      title: '긴 본문',
      message:
        '이 메시지는 여러 줄로 줄바꿈될 수 있는 긴 안내 문구를 시뮬레이션합니다. 토스트 카드의 최대 너비 안에서 타이포와 여백이 자연스럽게 보이는지 확인합니다.',
    }),
  },
} satisfies Story;
