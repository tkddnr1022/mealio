import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  ProfileIconShell,
} from '@/components/ui/ProfileIconShell';
import { type ProfileIconShellProvider } from '@/lib/auth/providers';

const providerOptions = [
  'none',
  'kakao',
  'naver',
  'google',
] as const satisfies readonly ProfileIconShellProvider[];

const meta = {
  title: 'UI/ProfileIconShell',
  component: ProfileIconShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    provider: 'none',
  },
  argTypes: {
    provider: {
      control: 'select',
      options: providerOptions,
    },
  },
} satisfies Meta<typeof ProfileIconShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground = {} satisfies Story;

export const ProviderMatrix = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {providerOptions.map((provider) => (
        <ProfileIconShell key={provider} provider={provider} />
      ))}
    </div>
  ),
} satisfies Story;
