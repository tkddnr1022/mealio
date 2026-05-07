import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Navbar } from '@/components/layout/Navbar';
import { AddButton } from '@/components/ui/buttons/AddButton';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import { ShareButton } from '@/components/ui/buttons/ShareButton';

const meta = {
  title: 'Layout/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
} satisfies Meta<typeof Navbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly = {
  name: 'Title Only',
} satisfies Story;

export const AddOnly = {
  name: 'Add Only',
  args: {
    additionalButtons: <AddButton />,
  },
} satisfies Story;

export const BackOnly = {
  name: 'Back Only',
  args: {
    displayBackButton: true,
    displayTitle: false,
  },
} satisfies Story;

export const AddWithBack = {
  name: 'Add With Back',
  args: {
    displayBackButton: true,
    displayTitle: false,
    additionalButtons: <AddButton />,
  },
} satisfies Story;

export const EngageWithBack = {
  name: 'Engage With Back',
  args: {
    displayBackButton: true,
    displayTitle: false,
    additionalButtons: (
      <div className="flex items-center gap-2">
        <LikeButton />
        <ShareButton />
      </div>
    ),
  },
} satisfies Story;
