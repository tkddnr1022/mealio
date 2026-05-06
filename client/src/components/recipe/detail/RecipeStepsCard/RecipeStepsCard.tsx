import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  RecipeStepRow,
  type RecipeStepRowProps,
} from '@/components/recipe/detail/RecipeStepRow';

export type RecipeStepItem = Readonly<{
  step: string;
  instruction: string;
}>;

export interface RecipeStepsCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  steps?: readonly RecipeStepItem[];
  rowClassName?: string;
  rowProps?: Omit<RecipeStepRowProps, 'step' | 'instruction' | 'className'>;
}

export function RecipeStepsCard({
  className = '',
  title = '조리 순서',
  steps = [],
  rowClassName = '',
  rowProps,
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
            step={item.step}
            instruction={item.instruction}
            className={rowClassName}
            {...rowProps}
          />
        ))}
      </div>
    </section>
  );
}
