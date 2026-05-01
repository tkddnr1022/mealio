import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { RecipeGridCard, type RecipeGridCardProps } from "@/components/recipe/cards/RecipeGridCard";

export type RecipeGridItem = RecipeGridCardProps;

export interface RecipeGridProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
recipes: readonly RecipeGridItem[];
cardClassName?: string;
}

/**
 * 2열 레시피 그리드 (Figma RecipeGrid, node 167:2276).
 * 열 간격 16px·행 간격 24px — design_tokens spacing-4 / spacing-6.
 */
export function RecipeGrid({
  className = "",
  recipes,
  cardClassName = "",
  ...rest
}: RecipeGridProps) {
  return (
    <div
      className={cn("grid w-full grid-cols-2 gap-x-4 gap-y-6", className)}
      data-name="RecipeGrid"
      {...rest}
    >
      {recipes.map((recipe, index) => {
        const { className: itemClassName = "", ...cardProps } = recipe;
        const mergedCardClass = cn(cardClassName, itemClassName);
        return (
          <RecipeGridCard
            key={cardProps.id ?? `recipe-grid-${index}`}
            {...cardProps}
            className={mergedCardClass}
          />
        );
      })}
    </div>
  );
}
