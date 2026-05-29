import type { HTMLAttributes } from 'react';
import { HashTag } from '@/components/ui/HashTag';
import { BaseRow } from '@/components/ui/BaseRow';

export type HashTagItem = Readonly<{
  label: string;
  href?: string;
}>;

export interface HashTagsRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  items?: readonly HashTagItem[];
}

export function HashTagsRow({
  className = '',
  items = [],
  ...rest
}: HashTagsRowProps) {
  return (
    <BaseRow className={className} data-name="HashTagsRow" {...rest}>
      {items.map((item, index) => (
        <HashTag
          key={`${item.label}-${index}`}
          label={item.label}
          href={item.href}
          className="shrink-0"
        />
      ))}
    </BaseRow>
  );
}
