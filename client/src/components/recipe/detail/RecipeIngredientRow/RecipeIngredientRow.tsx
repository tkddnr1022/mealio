import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type RecipeIngredientRowProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    name?: string;
    quantity?: string;
  }
>;

export function RecipeIngredientRow({
  className = "",
  name = "Name",
  quantity = "Amount",
  ...rest
}: RecipeIngredientRowProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between border-b border-border-subtle py-3",
        className,
      )}
      data-name="RecipeIngredientRow"
      {...rest}
    >
      <span className="typo-body-regular style-text-primary">{name}</span>
      <span className="typo-body-bold style-text-secondary">{quantity}</span>
    </div>
  );
}
