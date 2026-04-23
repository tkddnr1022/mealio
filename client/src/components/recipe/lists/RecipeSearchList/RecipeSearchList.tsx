import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import {
  RecipeSearchCard,
  type RecipeSearchCardProps,
} from "@/components/recipe/cards/RecipeSearchCard";

export type RecipeSearchListItem = RecipeSearchCardProps;

export type RecipeSearchListProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    recipes: readonly RecipeSearchListItem[];
    cardClassName?: string;
  }
>;

export function RecipeSearchList({
  className = "",
  recipes,
  cardClassName = "",
  ...rest
}: RecipeSearchListProps) {
  return (
    <div
      className={cn("flex w-full flex-col gap-6", className)}
      data-name="RecipeSearchList"
      {...rest}
    >
      {recipes.map((recipe, index) => {
        const { className: itemClassName = "", ...cardProps } = recipe;
        const mergedCardClass = cn(cardClassName, itemClassName);
        return (
          <RecipeSearchCard
            key={cardProps.id ?? `recipe-search-${index}`}
            {...cardProps}
            className={mergedCardClass}
          />
        );
      })}
    </div>
  );
}
