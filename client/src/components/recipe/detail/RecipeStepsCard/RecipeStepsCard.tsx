import type { HTMLAttributes } from 'react';
import type { RecipeInstructionStep } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import {
  RecipeStepRow,
  type RecipeStepRowProps,
} from '@/components/recipe/detail/RecipeStepRow';
import { toRecipeStepLabel } from '@/components/recipe/utils/recipe-format';

export interface RecipeStepsCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  steps?: readonly RecipeInstructionStep[];
  rowClassName?: string;
  rowProps?: Omit<
    RecipeStepRowProps,
    'step' | 'instruction' | 'imageUrl' | 'imageAlt' | 'className'
  >;
  stepImageAlt?: string;
}

export function RecipeStepsCard({
  className = '',
  title = '조리 순서',
  steps = [],
  rowClassName = '',
  rowProps,
  stepImageAlt = '',
  ...rest
}: RecipeStepsCardProps) {
  return (
    <section
      className={cn('card flex w-full flex-col', className)}
      data-name="RecipeStepsCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <div className="flex w-full flex-col gap-4">
        {steps.map((item, index) => (
          <RecipeStepRow
            key={`${item.step}-${index}`}
            step={toRecipeStepLabel(item.step)}
            instruction={item.content}
            imageUrl={item.imageUrl}
            imageAlt={
              stepImageAlt
                ? `${stepImageAlt} ${toRecipeStepLabel(item.step)}단계`
                : ''
            }
            className={rowClassName}
            {...rowProps}
          />
        ))}
      </div>
    </section>
  );
}
