import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { CardTagsRow, type CardTagItem } from '@/components/ui/CardTagsRow';
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

export interface RecipeDetailContentProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  headerProps?: RecipeDetailHeaderProps;
  tags?: readonly CardTagItem[];
  ingredientsCardProps?: RecipeIngredientsCardProps;
  stepsCardProps?: RecipeStepsCardProps;
}

export function RecipeDetailContent({
  className = '',
  headerProps,
  tags = [],
  ingredientsCardProps,
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
      <CardTagsRow items={tags} />
      <RecipeIngredientsCard {...ingredientsCardProps} />
      <RecipeStepsCard {...stepsCardProps} />
    </section>
  );
}
