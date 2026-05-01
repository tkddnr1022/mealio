import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import {
  IngredientGrid,
  type IngredientGridItem,
} from "@/components/inventory/IngredientGrid";
import {
  IngredientGridHeader,
  type IngredientGridHeaderProps,
} from "@/components/inventory/IngredientGridHeader";

export interface IngredientSearchResultProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
items?: readonly IngredientGridItem[];
headerProps?: Omit<IngredientGridHeaderProps, "countText">;
countText?: string;
cardClassName?: string;
}

export function IngredientSearchResult({
  className = "",
  items = [],
  headerProps,
  countText,
  cardClassName = "",
  ...rest
}: IngredientSearchResultProps) {
  const resolvedCountText = countText ?? `${items.length}개의 재료`;

  return (
    <section
      className={cn("flex w-full flex-col items-start gap-3", className)}
      data-name="IngredientSearchResult"
      {...rest}
    >
      <IngredientGridHeader {...headerProps} countText={resolvedCountText} />
      <IngredientGrid items={items} cardClassName={cardClassName} />
    </section>
  );
}
