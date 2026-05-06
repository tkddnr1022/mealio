import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { MiniTag } from '@/components/ui/MiniTag';

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
    <div
      className={cn(
        'hide-native-scrollbar flex w-full items-center gap-3 overflow-x-auto',
        className,
      )}
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
    </div>
  );
}
