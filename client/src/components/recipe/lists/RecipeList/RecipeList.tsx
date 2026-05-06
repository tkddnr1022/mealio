import type { HTMLAttributes } from 'react';
import type { RecipeSummary } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import {
  RecipeCard,
} from '@/components/recipe/cards/RecipeCard';

export interface RecipeListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  recipes: readonly RecipeSummary[];
  cardClassName?: string;
}

export function RecipeList({
  className = '',
  recipes,
  cardClassName = '',
  ...rest
}: RecipeListProps) {
  return (
    <div
      className={cn('flex w-full flex-col gap-6', className)}
      data-name="RecipeList"
      {...rest}
    >
      {recipes.map((recipe) => {
        return (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            className={cardClassName}
          />
        );
      })}
    </div>
  );
}
