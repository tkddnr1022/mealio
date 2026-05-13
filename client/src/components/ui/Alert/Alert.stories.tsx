import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Alert } from '@/components/ui/Alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(100vw-2rem,22.5rem)]">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Title',
    message: 'Message',
    variant: 'error',
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Error = {
  args: {
    variant: 'error',
    title: '오류가 발생했습니다',
    message: '다시 시도하거나 잠시 후 이용해 주세요.',
  },
} satisfies Story;

export const Warning = {
  args: {
    variant: 'warning',
    title: '확인이 필요합니다',
    message: '입력한 내용을 한 번 더 검토해 주세요.',
  },
} satisfies Story;

export const Info = {
  args: {
    variant: 'info',
    title: '안내',
    message: '변경 사항은 설정에서 언제든지 수정할 수 있습니다.',
  },
} satisfies Story;

export const TitleOnly = {
  args: {
    variant: 'info',
    title: '제목만 있는 알림',
    message: undefined,
  },
} satisfies Story;
