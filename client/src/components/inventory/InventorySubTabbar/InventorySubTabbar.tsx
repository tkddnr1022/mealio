import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { SubTab } from "@/components/ui/SubTab";

export const INVENTORY_SUB_TABBAR_INDEXES = [1, 2, 3] as const;
export type InventorySubTabbarSelectedIndex = (typeof INVENTORY_SUB_TABBAR_INDEXES)[number];

export type InventorySubTabbarItem = Readonly<{
  id: string;
  label: string;
}>;

export interface InventorySubTabbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  className?: string;
  selectedIndex?: InventorySubTabbarSelectedIndex;
  items?: readonly InventorySubTabbarItem[];
  onSelect?: (next: InventorySubTabbarSelectedIndex) => void;
}

export function InventorySubTabbar({
  className = "",
  selectedIndex = 1,
  items = [],
  onSelect,
  ...rest
}: InventorySubTabbarProps) {
  return (
    <div className={cn("flex w-full items-start bg-background-surface", className)} {...rest}>
      {items.map((item, index) => {
        const tabIndex = (index + 1) as InventorySubTabbarSelectedIndex;
        return (
          <SubTab
            key={item.id}
            label={item.label}
            selected={tabIndex === selectedIndex}
            onClick={() => onSelect?.(tabIndex)}
            className="flex-1"
          />
        );
      })}
    </div>
  );
}
