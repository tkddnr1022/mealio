import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { SubTab } from "@/components/ui/SubTab";

export type InventorySubTabbarItem = Readonly<{
  id: string;
  label: string;
}>;

export interface InventorySubTabbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  className?: string;
  /** 비우면 `items[0]?.id`를 선택된 것으로 표시 */
  selected?: string;
  items?: readonly InventorySubTabbarItem[];
  onSelect?: (itemId: string) => void;
}

export function InventorySubTabbar({
  className = "",
  selected,
  items = [],
  onSelect,
  ...rest
}: InventorySubTabbarProps) {
  const effectiveSelectedId = selected ?? items[0]?.id;

  return (
    <div className={cn("flex w-full items-start bg-background-surface", className)} {...rest}>
      {items.map((item) => (
        <SubTab
          key={item.id}
          label={item.label}
          selected={item.id === effectiveSelectedId}
          onClick={() => onSelect?.(item.id)}
          className="flex-1"
        />
      ))}
    </div>
  );
}
