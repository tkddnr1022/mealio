import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CardTag } from "@/components/ui/CardTag";

export type CardTagItem = Readonly<{
  label: string;
  leftIcon?: ReactNode;
}>;

export interface CardTagsRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> {
className?: string;
items?: readonly CardTagItem[];
}

export function CardTagsRow({
  className = "",
  items = [],
  ...rest
}: CardTagsRowProps) {
  return (
    <div
      className={cn("flex w-full flex-wrap items-start gap-3", className)}
      data-name="CardTagsRow"
      {...rest}
    >
      {items.map((item, index) => (
        <CardTag
          key={`${item.label}-${index}`}
          label={item.label}
          leftIcon={item.leftIcon}
        />
      ))}
    </div>
  );
}
