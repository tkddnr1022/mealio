import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { CardTagsRow, type CardTagItem } from '@/components/ui/CardTagsRow';
import {
  HashTagsRow,
  type HashTagItem,
} from '@/components/ui/HashTagsRow';
import {
  RecipeDetailHeader,
  type RecipeDetailHeaderProps,
} from '@/components/recipe/detail/RecipeDetailHeader';
import {
  RecipeIngredientsCard,
  type RecipeIngredientsCardProps,
} from '@/components/recipe/detail/RecipeIngredientsCard';
import {
  RecipeStepsCard,
  type RecipeStepsCardProps,
} from '@/components/recipe/detail/RecipeStepsCard';
import {
  RecipeNutritionCard,
  type RecipeNutritionCardProps,
} from '@/components/recipe/detail/RecipeNutritionCard';
import {
  RecipeTipsCard,
  type RecipeTipsCardProps,
} from '@/components/recipe/detail/RecipeTipsCard';

export interface RecipeDetailContentProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  headerProps?: RecipeDetailHeaderProps;
  hashTags?: readonly HashTagItem[];
  metaTags?: readonly CardTagItem[];
  ingredientsCardProps?: RecipeIngredientsCardProps;
  nutritionCardProps?: RecipeNutritionCardProps;
  tipsCardProps?: RecipeTipsCardProps;
  stepsCardProps?: RecipeStepsCardProps;
}

export function RecipeDetailContent({
  className = '',
  headerProps,
  hashTags = [],
  metaTags = [],
  ingredientsCardProps,
  nutritionCardProps,
  tipsCardProps,
  stepsCardProps,
  ...rest
}: RecipeDetailContentProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col items-start gap-6 overflow-hidden px-4 py-6',
        className,
      )}
      data-name="RecipeDetailContent"
      {...rest}
    >
      <RecipeDetailHeader {...headerProps} />
      <CardTagsRow items={metaTags} />
      <HashTagsRow items={hashTags} />
      <RecipeIngredientsCard {...ingredientsCardProps} />
      <RecipeNutritionCard {...nutritionCardProps} />
      <RecipeTipsCard {...tipsCardProps} />
      <RecipeStepsCard {...stepsCardProps} />
    </section>
  );
}
