import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { RecipeGridCard, type RecipeGridCardProps } from "./RecipeGridCard";

export type RecipeGridItem = RecipeGridCardProps;

export type RecipeGridProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** 그리드에 표시할 레시피 카드 데이터 (순서대로 2열 배치) */
    recipes: readonly RecipeGridItem[];
    /** 모든 카드에 공통 적용할 클래스 */
    cardClassName?: string;
  }
>;

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
