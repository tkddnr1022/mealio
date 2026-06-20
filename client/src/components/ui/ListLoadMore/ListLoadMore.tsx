'use client';

import type { HTMLAttributes } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export interface ListLoadMoreProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  hasMore: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
}

export function ListLoadMore({
  className = '',
  hasMore,
  isLoading = false,
  onLoadMore,
  ...rest
}: ListLoadMoreProps) {
  if (!hasMore) {
    return null;
  }

  const label = isLoading ? '불러오는 중…' : '더 보기';

  return (
    <div
      className={cn('flex w-full justify-center', className)}
      data-name="ListLoadMore"
      {...rest}
    >
      <Button
        type="button"
        variant="primary"
        size="medium"
        label={label}
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={onLoadMore}
        className="w-full max-w-sm"
      />
    </div>
  );
}
