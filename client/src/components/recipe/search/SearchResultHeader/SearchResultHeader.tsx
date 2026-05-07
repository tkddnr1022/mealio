import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChipsRow, type ChipsRowProps } from '@/components/ui/ChipsRow';
import {
  SearchResultMeta,
  type SearchResultMetaProps,
} from '@/components/recipe/search/SearchResultMeta';

export interface SearchResultHeaderProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'className' | 'children'
> {
  className?: string;
  searchResultMetaProps?: SearchResultMetaProps;
  chipsRowProps?: ChipsRowProps;
}

export function SearchResultHeader({
  className = '',
  searchResultMetaProps,
  chipsRowProps,
  ...rest
}: SearchResultHeaderProps) {
  return (
    <header
      className={cn(
        'flex w-full flex-col items-start gap-4 overflow-hidden bg-background-surface p-4',
        className,
      )}
      data-name="SearchResultHeader"
      {...rest}
    >
      <SearchResultMeta {...searchResultMetaProps} />
      <ChipsRow {...chipsRowProps} />
    </header>
  );
}
