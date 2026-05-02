import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { RecipeCard, type RecipeCardProps } from "@/components/recipe/cards/RecipeCard";

export type RecipeListItem = RecipeCardProps;

export interface RecipeListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
recipes: readonly RecipeListItem[];
cardClassName?: string;
}

export function RecipeList({
  className = "",
  recipes,
  cardClassName = "",
  ...rest
}: RecipeListProps) {
  return (
    <div
      className={cn("flex w-full flex-col gap-6", className)}
      data-name="RecipeList"
      {...rest}
    >
      {recipes.map((recipe) => {
        const { className: itemClassName = "", ...cardProps } = recipe;
        const mergedCardClass = cn(cardClassName, itemClassName);
        return (
          <RecipeCard
            key={cardProps.recipeId}
            {...cardProps}
            className={mergedCardClass}
          />
        );
      })}
    </div>
  );
}
