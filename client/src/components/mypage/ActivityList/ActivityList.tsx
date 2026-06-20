import type { HTMLAttributes } from 'react';
import type { UserActivityItem } from '@/lib/types/user';
import { cn } from '@/lib/utils/cn';
import { ActivityCard } from '@/components/mypage/ActivityCard';

export interface ActivityListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items: readonly UserActivityItem[];
  cardClassName?: string;
}

export function ActivityList({
  className = '',
  items,
  cardClassName = '',
  ...rest
}: ActivityListProps) {
  return (
    <div
      className={cn('flex w-full flex-col gap-4', className)}
      data-name="ActivityList"
      {...rest}
    >
      {items.map((item) => (
        <ActivityCard
          key={item.id}
          item={item}
          className={cardClassName}
        />
      ))}
    </div>
  );
}
