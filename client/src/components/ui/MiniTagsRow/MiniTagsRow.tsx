import type { HTMLAttributes } from 'react';
import { MiniTag } from '@/components/ui/MiniTag';
import { BaseRow } from '@/components/ui/BaseRow';

export type MiniTagItem = Readonly<{
  label: string;
}>;

export interface MiniTagsRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items?: readonly MiniTagItem[];
}

export function MiniTagsRow({
  className = '',
  items = [],
  ...rest
}: MiniTagsRowProps) {
  return (
    <BaseRow
      className={className}
      data-name="MiniTagsRow"
      {...rest}
    >
      {items.map((item, index) => (
        <MiniTag
          key={`${item.label}-${index}`}
          label={item.label}
          className="shrink-0"
        />
      ))}
    </BaseRow>
  );
}
