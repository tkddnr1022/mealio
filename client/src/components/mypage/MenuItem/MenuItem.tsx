'use client';

import { ChevronRight } from 'lucide-react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { NavLink } from '@/components/ui/NavLink';
import { cn } from '@/lib/utils/cn';

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

/** `href`가 없으면 `<button>`으로 렌더한다. (`Button`과 동일한 문자열 `href` 판별 규칙) */
export type MenuItemButtonProps = MenuItemShared & {
  href?: undefined;
} & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof MenuItemShared | 'children' | 'href'
  >;

export type MenuItemProps = MenuItemLinkProps | MenuItemButtonProps;

function isMenuItemLink(props: MenuItemProps): props is MenuItemLinkProps {
  return typeof props.href === 'string' && props.href.length > 0;
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

  if (isMenuItemLink(props)) {
    const {
      href,
      className: menuClassName,
      border,
      label,
      labelClassName,
      leadingIcon,
      ...anchorDomProps
    } = props;
    void menuClassName;
    void border;
    void label;
    void labelClassName;
    void leadingIcon;
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

  const {
    onClick,
    disabled,
    type = 'button',
    className: menuClassName,
    border: stripBorder,
    label: stripLabel,
    labelClassName: stripLabelClassName,
    leadingIcon: stripLeadingIcon,
    ...buttonRest
  } = props;
  void menuClassName;
  void stripBorder;
  void stripLabel;
  void stripLabelClassName;
  void stripLeadingIcon;

  return (
    <button
      type={type}
      disabled={disabled}
      className={surfaceClass}
      data-name="MenuItem"
      onClick={onClick}
      {...buttonRest}
    >
      {inner}
    </button>
  );
}
