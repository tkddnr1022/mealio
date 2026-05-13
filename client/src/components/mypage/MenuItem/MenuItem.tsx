'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { NavLink } from '@/components/ui/NavLink';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { cn } from '@/lib/utils/cn';
import { logout } from '@/lib/api/domains/auth.api';
import { isApiError } from '@/lib/api/error';

export interface MenuItemShared {
  className?: string;
  border?: boolean;
  label?: string;
  /** 라벨에 추가 클래스 (예: 로그아웃 강조색) */
  labelClassName?: string;
  leadingIcon?: ReactNode;
}

export type MenuItemLinkProps = MenuItemShared & {
  href: string;
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof MenuItemShared | 'children'
>;

export type MenuItemButtonProps = MenuItemShared & {
  href?: never;
  /**
   * `logout`: 내부에서 `POST /api/v1/auth/logout` 후 `/login`으로 이동.
   * (`action`은 React `ButtonHTMLAttributes`와 충돌하므로 `menuAction` 사용)
   */
  menuAction?: 'logout';
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof MenuItemShared | 'children'
>;

export type MenuItemProps = MenuItemLinkProps | MenuItemButtonProps;

function isLinkProps(props: MenuItemProps): props is MenuItemLinkProps {
  return 'href' in props && typeof props.href === 'string';
}

export function MenuItem(props: MenuItemProps) {
  const {
    className = '',
    border = false,
    label,
    labelClassName,
    leadingIcon,
  } = props;

  const surfaceClass = cn(
    'flex w-full items-center gap-4 bg-background-surface text-left outline-none py-4',
    border ? 'border-b border-border-muted' : '',
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
      <span
        className={cn(
          'min-w-px flex-1 typo-label-toggle style-text-primary',
          labelClassName,
        )}
      >
        {label}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-primary-inactive"
        strokeWidth={2.25}
        aria-hidden
      />
    </>
  );

  if (isLinkProps(props)) {
    const {
      href,
      className: _linkClassName,
      border: _border,
      label: _label,
      labelClassName: _labelClassName,
      leadingIcon: _leadingIcon,
      ...anchorDomProps
    } = props;
    return (
      <NavLink
        href={href}
        className={surfaceClass}
        data-name="MenuItem"
        {...anchorDomProps}
      >
        {inner}
      </NavLink>
    );
  }

  return (
    <MenuItemButtonInner
      surfaceClass={surfaceClass}
      inner={inner}
      props={props}
    />
  );
}

function MenuItemButtonInner({
  surfaceClass,
  inner,
  props,
}: Readonly<{
  surfaceClass: string;
  inner: ReactNode;
  props: MenuItemButtonProps;
}>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const {
    menuAction,
    onClick,
    disabled,
    type = 'button',
    className: _c,
    border: _b,
    label,
    labelClassName: _lc,
    leadingIcon: _li,
    ...buttonRest
  } = props;

  const isLogout = menuAction === 'logout';

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (isLogout) {
      e.preventDefault();
      void (async () => {
        if (busy || disabled) return;
        setBusy(true);
        try {
          await logout();
          router.replace('/login');
          router.refresh();
        } catch (err) {
          if (isApiError(err) && typeof window !== 'undefined') {
            window.alert(err.getUserMessage());
          }
        } finally {
          setBusy(false);
        }
      })();
      return;
    }
    onClick?.(e);
  };

  const effectiveDisabled = Boolean(disabled || (isLogout && busy));
  const showBusyOpacity = isLogout && busy;

  return (
    <button
      type={type}
      disabled={effectiveDisabled}
      className={cn(
        surfaceClass,
        showBusyOpacity && 'pointer-events-none opacity-60',
      )}
      data-name="MenuItem"
      aria-label={
        isLogout ? buildAriaLabel('button', label?.trim() || '로그아웃') : undefined
      }
      onClick={handleClick}
      {...buttonRest}
    >
      {inner}
    </button>
  );
}
