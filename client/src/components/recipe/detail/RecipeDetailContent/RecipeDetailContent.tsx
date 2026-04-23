import { Clock3, Flame, UsersRound } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { CardTagsRow, type CardTagItem } from "@/components/ui/CardTagsRow";
import {
  RecipeDetailHeader,
  type RecipeDetailHeaderProps,
} from "@/components/recipe/detail/RecipeDetailHeader";
import {
  RecipeIngredientsCard,
  type RecipeIngredientsCardProps,
} from "@/components/recipe/detail/RecipeIngredientsCard";
import {
  RecipeStepsCard,
  type RecipeStepsCardProps,
} from "@/components/recipe/detail/RecipeStepsCard";

export type RecipeDetailContentProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    headerProps?: RecipeDetailHeaderProps;
    tags?: readonly CardTagItem[];
    ingredientsCardProps?: RecipeIngredientsCardProps;
    stepsCardProps?: RecipeStepsCardProps;
  }
>;

const defaultTags: readonly CardTagItem[] = [
  {
    label: "15분",
    leftIcon: <Clock3 className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
  {
    label: "쉬움",
    leftIcon: <Flame className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
  {
    label: "2인분",
    leftIcon: <UsersRound className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  },
];

export function RecipeDetailContent({
  className = "",
  headerProps,
  tags = defaultTags,
  ingredientsCardProps,
  stepsCardProps,
  ...rest
}: RecipeDetailContentProps) {
  return (
    <section
      className={cn("flex w-full flex-col items-start gap-6 overflow-hidden px-4 py-6", className)}
      data-name="RecipeDetailContent"
      {...rest}
    >
      <RecipeDetailHeader {...headerProps} />
      <CardTagsRow items={tags} />
      <RecipeIngredientsCard {...ingredientsCardProps} />
      <RecipeStepsCard {...stepsCardProps} />
    </section>
  );
}
