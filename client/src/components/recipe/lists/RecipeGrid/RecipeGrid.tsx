import type { HTMLAttributes } from 'react';
import type { RecipeSummary } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';

import { RecipeGridCard } from '@/components/recipe/cards/RecipeGridCard';
import {
  DEFAULT_RECIPE_GRID_LAYOUT,
  getRecipeGridColsClass,
  type RecipeGridLayout,
} from '@/components/recipe/lists/recipe-grid-layout';

export interface RecipeGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  recipes: readonly RecipeSummary[];
  cardClassName?: string;
  /** 그리드 열·행 구성. 기본 2×2 (Figma RecipeGrid, node 167:2276) */
  layout?: RecipeGridLayout;
}

/**
 * 레시피 그리드 (Figma RecipeGrid, node 167:2276).
 * 열 간격 16px·행 간격 24px — design_tokens spacing-4 / spacing-6.
 */
export function RecipeGrid({
  className = '',
  recipes,
  cardClassName = '',
  layout = DEFAULT_RECIPE_GRID_LAYOUT,
  ...rest
}: RecipeGridProps) {
  return (
    <div
      className={cn(
        'grid w-full gap-x-4 gap-y-6',
        getRecipeGridColsClass(layout.columns),
        className,
      )}
      data-name="RecipeGrid"
      {...rest}
    >
      {recipes.map((recipe) => {
        return (
          <RecipeGridCard
            key={recipe.id}
            recipe={recipe}
            className={cardClassName}
          />
        );
      })}
    </div>
  );
}
