import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { UserProfile } from '@/components/mypage/UserProfile/index';

const meta = {
  title: 'Mypage/UserProfile',
  component: UserProfile,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoggedIn = {
  name: 'loggedIn=true',
  args: {
    loggedIn: true,
    nickname: '김레시피',
    email: 'recipe@example.com',
  },
} satisfies Story;

export const LoggedOut = {
  name: 'loggedIn=false',
  args: {
    loggedIn: false,
    message: '로그인이 필요합니다',
  },
} satisfies Story;
