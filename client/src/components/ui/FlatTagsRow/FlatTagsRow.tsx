import type { HTMLAttributes, ReactNode } from 'react';
import { FlatTag } from '@/components/ui/FlatTag';
import { BaseRow } from '@/components/ui/BaseRow';

export type FlatTagItem = Readonly<{
  label: string;
  leftIcon?: ReactNode;
  accent?: boolean;
}>;

export interface FlatTagsRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  items?: readonly FlatTagItem[];
}

export function FlatTagsRow({
  className = '',
  items = [],
  ...rest
}: FlatTagsRowProps) {
  return (
    <BaseRow className={className} data-name="FlatTagsRow" {...rest}>
      {items.map((item, index) => (
        <FlatTag
          key={`${item.label}-${index}`}
          label={item.label}
          leftIcon={item.leftIcon}
          accent={item.accent ?? false}
          className="shrink-0"
        />
      ))}
    </BaseRow>
  );
}
