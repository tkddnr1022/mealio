import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { isInternalNavHref } from '@/lib/utils/isInternalNavHref';

export interface MenuItemProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'className' | 'children' | 'href'
> {
  className?: string;
  border?: boolean;
  label?: string;
  leadingIcon?: ReactNode;
  /** 앱 내 `/...`는 `Link`, 그 외는 `<a>` */
  href: string;
}

export function MenuItem({
  className = '',
  border = false,
  label,
  leadingIcon,
  href,
  ...rest
}: MenuItemProps) {
  const surfaceClass = cn(
    'flex w-full items-center gap-4 bg-background-surface text-left outline-none',
    border ? 'border-b border-border-muted pb-[17px] pt-4' : 'py-4',
    className,
  );

  const inner = (
    <>
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-dropdown-selected-default style-text-accent"
      >
        {leadingIcon}
      </span>
      <span className="min-w-px flex-1 typo-label-toggle style-text-primary">
        {label}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-primary-inactive"
        strokeWidth={2.25}
        aria-hidden
      />
    </>
  );

  if (isInternalNavHref(href)) {
    return (
      <Link href={href} className={surfaceClass} data-name="MenuItem" {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <a href={href} className={surfaceClass} data-name="MenuItem" {...rest}>
      {inner}
    </a>
  );
}
