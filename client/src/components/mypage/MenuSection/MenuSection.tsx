import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { MenuItem, type MenuItemProps } from "@/components/mypage/MenuItem";

export type MenuSectionProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    items?: readonly MenuItemProps[];
  }
>;

const DEFAULT_ITEMS: readonly MenuItemProps[] = [
  { label: "내 레시피 관리", border: true },
  { label: "계정 설정", border: false },
];

export function MenuSection({
  className = "",
  items = DEFAULT_ITEMS,
  ...rest
}: MenuSectionProps) {
  return (
    <section
      className={cn("w-full bg-background-surface px-4 shadow-(--semantic-shadow-sm)", className)}
      data-name="MenuSection"
      {...rest}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.label ?? `menu-item-${index}`}
          {...item}
          border={item.border ?? index !== items.length - 1}
        />
      ))}
    </section>
  );
}
