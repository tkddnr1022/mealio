import type { HTMLAttributes } from 'react';
import type { RecipeNutrition } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import { toRecipeNutritionDisplayItems } from '@/components/recipe/utils/recipe-format';

export interface RecipeNutritionCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  nutrition?: RecipeNutrition | null;
}

export function RecipeNutritionCard({
  className = '',
  title = '영양 정보',
  nutrition = null,
  ...rest
}: RecipeNutritionCardProps) {
  const items = toRecipeNutritionDisplayItems(nutrition);
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('card flex w-full flex-col gap-4', className)}
      data-name="RecipeNutritionCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 rounded-lg bg-background-placeholder px-3 py-2"
          >
            <dt className="typo-caption-regular style-text-secondary">
              {item.label}
            </dt>
            <dd className="typo-body-regular style-text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
