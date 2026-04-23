import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import {
  RecipeIngredientRow,
  type RecipeIngredientRowProps,
} from "@/components/recipe/detail/RecipeIngredientRow";

export type RecipeIngredientItem = Readonly<{
  name: string;
  quantity: string;
}>;

export type RecipeIngredientsCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    title?: string;
    ingredients?: readonly RecipeIngredientItem[];
    rowClassName?: string;
    rowProps?: Omit<RecipeIngredientRowProps, "name" | "quantity" | "className">;
  }
>;

const defaultIngredients: readonly RecipeIngredientItem[] = [
  { name: "밥", quantity: "2공기" },
  { name: "소고기", quantity: "150g" },
];

export function RecipeIngredientsCard({
  className = "",
  title = "재료",
  ingredients = defaultIngredients,
  rowClassName = "",
  rowProps,
  ...rest
}: RecipeIngredientsCardProps) {
  return (
    <section
      className={cn("card flex w-full flex-col", className)}
      data-name="RecipeIngredientsCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <div className="flex w-full flex-col">
        {ingredients.map((ingredient, index) => (
          <RecipeIngredientRow
            key={`${ingredient.name}-${index}`}
            name={ingredient.name}
            quantity={ingredient.quantity}
            className={rowClassName}
            {...rowProps}
          />
        ))}
      </div>
    </section>
  );
}
