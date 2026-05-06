import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { SubTab } from '@/components/ui/SubTab';

export type InventorySubTabbarItem = Readonly<{
  id: string;
  label: string;
  /** 있으면 `SubTab`이 `Link`(앱 내 경로) 또는 `<a>`로 렌더 */
  href?: string;
}>;

export interface InventorySubTabbarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect'
> {
  className?: string;
  /** 비우면 `items[0]?.id`를 선택된 것으로 표시 */
  selected?: string;
  items?: readonly InventorySubTabbarItem[];
  onSelect?: (itemId: string) => void;
  /** Storybook 등에서 링크 기본 동작을 막을 때 */
  preventLinkNavigation?: boolean;
}

export function InventorySubTabbar({
  className = '',
  selected,
  items = [],
  onSelect,
  preventLinkNavigation = false,
  ...rest
}: InventorySubTabbarProps) {
  const effectiveSelectedId = selected ?? items[0]?.id;

  return (
    <div
      className={cn('flex w-full items-start bg-background-surface', className)}
      {...rest}
    >
      {items.map((item) => (
        <SubTab
          key={item.id}
          label={item.label}
          href={item.href}
          selected={item.id === effectiveSelectedId}
          preventLinkNavigation={preventLinkNavigation}
          onClick={() => onSelect?.(item.id)}
          className="flex-1"
        />
      ))}
    </div>
  );
}
