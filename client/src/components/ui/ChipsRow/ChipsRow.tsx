import type { HTMLAttributes } from 'react';
import { Chip } from '@/components/ui/Chip';
import { BaseRow } from '@/components/ui/BaseRow';

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
    <BaseRow
      className={className}
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
    </BaseRow>
  );
}
