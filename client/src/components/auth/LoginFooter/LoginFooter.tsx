import Link from 'next/link';
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { isInternalNavHref } from '@/lib/utils/isInternalNavHref';

export type LoginFooterLink = Readonly<{
  label: string;
  href?: string;
}>;

export interface LoginFooterProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  leftLink?: LoginFooterLink;
  rightLink?: LoginFooterLink;
  linkProps?: Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'children'
  >;
}

export function LoginFooter({
  className = '',
  leftLink = { label: '이용약관', href: '#' },
  rightLink = { label: '개인정보 처리방침', href: '#' },
  linkProps,
  ...rest
}: LoginFooterProps) {
  const linkClass = 'typo-caption-regular style-text-caption';

  const leftHref = leftLink.href ?? '#';
  const rightHref = rightLink.href ?? '#';

  const leftEl = isInternalNavHref(leftHref) ? (
    <Link href={leftHref} className={linkClass} {...linkProps}>
      {leftLink.label}
    </Link>
  ) : (
    <a className={linkClass} href={leftHref} {...linkProps}>
      {leftLink.label}
    </a>
  );

  const rightEl = isInternalNavHref(rightHref) ? (
    <Link href={rightHref} className={linkClass} {...linkProps}>
      {rightLink.label}
    </Link>
  ) : (
    <a className={linkClass} href={rightHref} {...linkProps}>
      {rightLink.label}
    </a>
  );

  return (
    <footer
      className={cn('flex w-full items-start justify-center gap-4', className)}
      data-name="LoginFooter"
      {...rest}
    >
      {leftEl}
      <span aria-hidden className="self-stretch py-1">
        <span className="block h-full w-px bg-border-subtle" />
      </span>
      {rightEl}
    </footer>
  );
}
