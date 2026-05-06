import type { HTMLAttributes, ReactNode } from 'react';
import { CardTag } from '@/components/ui/CardTag';
import { BaseRow } from '@/components/ui/BaseRow';

export type CardTagItem = Readonly<{
  label: string;
  leftIcon?: ReactNode;
}>;

export interface CardTagsRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  items?: readonly CardTagItem[];
}

export function CardTagsRow({
  className = '',
  items = [],
  ...rest
}: CardTagsRowProps) {
  return (
    <BaseRow className={className} data-name="CardTagsRow" {...rest}>
      {items.map((item, index) => (
        <CardTag
          key={`${item.label}-${index}`}
          label={item.label}
          leftIcon={item.leftIcon}
        />
      ))}
    </BaseRow>
  );
}
