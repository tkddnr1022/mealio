import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { Chip } from '@/components/ui/Chip';

export interface ChipsRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  labels?: readonly string[];
  onRemoveChip?: (index: number, label: string) => void;
}

export function ChipsRow({
  className = '',
  labels = ['Label', 'Label', 'Label'],
  onRemoveChip,
  ...rest
}: ChipsRowProps) {
  return (
    <div
      className={cn(
        'hide-native-scrollbar flex w-full items-center gap-2 overflow-x-auto',
        className,
      )}
      data-name="ChipsRow"
      {...rest}
    >
      {labels.map((label, index) => (
        <Chip
          key={`${label}-${index}`}
          label={label}
          className="shrink-0"
          onRemove={onRemoveChip ? () => onRemoveChip(index, label) : undefined}
        />
      ))}
    </div>
  );
}
