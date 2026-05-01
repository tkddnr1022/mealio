import { Beef, Egg, Fish, Milk, Wheat } from "lucide-react";
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

export type IngredientSearchResultProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    items?: readonly IngredientGridItem[];
    headerProps?: Omit<IngredientGridHeaderProps, "countText">;
    countText?: string;
    cardClassName?: string;
  }
>;

const DEFAULT_ITEMS: readonly IngredientGridItem[] = [
  { id: "apple", name: "사과", selected: true },
  { id: "beef", name: "소고기", leadingIcon: <Beef className="size-5" strokeWidth={2} /> },
  { id: "egg", name: "계란", leadingIcon: <Egg className="size-5" strokeWidth={2} /> },
  { id: "fish", name: "고등어", leadingIcon: <Fish className="size-5" strokeWidth={2} /> },
  { id: "milk", name: "우유", leadingIcon: <Milk className="size-5" strokeWidth={2} /> },
  { id: "wheat", name: "밀가루", leadingIcon: <Wheat className="size-5" strokeWidth={2} /> },
];

export function IngredientSearchResult({
  className = "",
  items = DEFAULT_ITEMS,
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
