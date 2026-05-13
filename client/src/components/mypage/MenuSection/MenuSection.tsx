import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  MenuItem,
  type MenuItemLinkProps,
  type MenuItemButtonProps,
} from '@/components/mypage/MenuItem';

/** `MenuSection`은 항목 사이 구분선을 index로만 결정하므로 `border`는 제외한다. */
export type MenuSectionItem =
  | Omit<MenuItemLinkProps, 'border'>
  | Omit<MenuItemButtonProps, 'border'>;

export interface MenuSectionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items?: readonly MenuSectionItem[];
}

export function MenuSection({
  className = '',
  items = [],
  ...rest
}: MenuSectionProps) {
  return (
    <section
      className={cn(
        'w-full bg-background-surface px-4 shadow-(--semantic-shadow-sm)',
        className,
      )}
      data-name="MenuSection"
      {...rest}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.label ?? `menu-item-${index}`}
          {...item}
          border={index !== items.length - 1}
        />
      ))}
    </section>
  );
}
