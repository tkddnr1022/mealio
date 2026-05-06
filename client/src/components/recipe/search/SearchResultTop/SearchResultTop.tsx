import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { BackButton } from '@/components/ui/buttons/BackButton';
import { SearchBar, type SearchBarProps } from '@/components/ui/SearchBar';

export interface SearchResultTopProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'className' | 'children'
> {
  className?: string;
  query?: string;
  onBackClick?: () => void;
  searchBarProps?: Omit<SearchBarProps, 'readOnly' | 'tabIndex'>;
}

export function SearchResultTop({
  className = '',
  query = 'Text',
  onBackClick,
  searchBarProps,
  ...rest
}: SearchResultTopProps) {
  return (
    <section
      className={cn(
        'flex w-full items-center gap-4 overflow-hidden bg-background-surface',
        className,
      )}
      data-name="SearchResultTop"
      {...rest}
    >
      <BackButton onClick={onBackClick} />
      <div className="min-w-0 flex-1">
        <SearchBar
          value={query}
          readOnly
          tabIndex={-1}
          {...searchBarProps}
          wrapperClassName={cn(
            'bg-background-primary',
            searchBarProps?.wrapperClassName,
          )}
        />
      </div>
    </section>
  );
}
