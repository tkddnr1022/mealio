import type { HTMLAttributes } from 'react';
import type { RecipeIngredientItem } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import {
  RecipeIngredientRow,
  type RecipeIngredientRowProps,
} from '@/components/recipe/detail/RecipeIngredientRow';
import { toIngredientQuantityLabel } from '@/components/recipe/utils/recipe-format';

export interface RecipeIngredientsCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  ingredients?: readonly RecipeIngredientItem[];
  rowClassName?: string;
  rowProps?: Omit<RecipeIngredientRowProps, 'name' | 'quantity' | 'className'>;
}

export function RecipeIngredientsCard({
  className = '',
  title = '재료',
  ingredients = [],
  rowClassName = '',
  rowProps,
  ...rest
}: RecipeIngredientsCardProps) {
  return (
    <section
      className={cn('card flex w-full flex-col', className)}
      data-name="RecipeIngredientsCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <div className="flex w-full flex-col">
        {ingredients.map((ingredient, index) => (
          <RecipeIngredientRow
            key={`${ingredient.name}-${index}`}
            name={ingredient.name}
            quantity={toIngredientQuantityLabel(ingredient)}
            className={rowClassName}
            {...rowProps}
          />
        ))}
      </div>
    </section>
  );
}
