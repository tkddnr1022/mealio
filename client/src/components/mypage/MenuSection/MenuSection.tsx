import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { MenuItem, type MenuItemProps } from "@/components/mypage/MenuItem";

export type MenuSectionProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    items?: readonly MenuItemProps[];
  }
>;

export function MenuSection({
  className = "",
  items = [],
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
