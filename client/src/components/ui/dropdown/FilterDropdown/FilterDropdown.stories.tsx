import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { FilterDropdown } from '@/components/ui/dropdown/FilterDropdown';
import type { DropdownOption } from '@/components/ui/dropdown/DropdownList';

const figmaWidth: Decorator = (Story) => (
  <div>
    <Story />
  </div>
);

const sampleOptions = [
  { value: 'selected', label: 'Label' },
  { value: 'option-a', label: 'Label' },
  { value: 'option-b', label: 'Label' },
] as const satisfies readonly DropdownOption[];

const meta = {
  title: 'UI/Dropdown/FilterDropdown',
  component: FilterDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    label: 'Label',
    defaultOpen: false,
    options: sampleOptions,
    selectedValue: 'selected',
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
    },
    open: {
      control: 'boolean',
      description: '제어 모드: 설정 시 defaultOpen 대신 사용',
    },
  },
} satisfies Meta<typeof FilterDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed = {
  args: {
    defaultOpen: false,
  },
} satisfies Story;

export const Open = {
  args: {
    defaultOpen: true,
  },
} satisfies Story;
