import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { NavLink } from '@/components/ui/NavLink';
import { cn } from '@/lib/utils/cn';

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

  const leftEl = (
    <NavLink href={leftHref} className={linkClass} {...linkProps}>
      {leftLink.label}
    </NavLink>
  );

  const rightEl = (
    <NavLink href={rightHref} className={linkClass} {...linkProps}>
      {rightLink.label}
    </NavLink>
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
