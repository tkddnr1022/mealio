import type { HTMLAttributes } from 'react';
import { AdaptiveImage } from '@/components/ui/AdaptiveImage';
import { cn } from '@/lib/utils/cn';

export interface RecipeStepRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  step?: string;
  instruction?: string;
  imageUrl?: string | null;
  imageAlt?: string;
}

export function RecipeStepRow({
  className = '',
  step = '1',
  instruction = 'Instruction',
  imageUrl = null,
  imageAlt = '',
  ...rest
}: RecipeStepRowProps) {
  const trimmedImageUrl = imageUrl?.trim();

  return (
    <div
      className={cn('flex w-full items-start gap-4', className)}
      data-name="RecipeStepRow"
      {...rest}
    >
      <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-background-placeholder">
        <span className="typo-caption-regular style-text-secondary">
          {step}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="typo-body-regular style-text-primary">{instruction}</p>
        {trimmedImageUrl ? (
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-background-placeholder">
            <AdaptiveImage
              src={trimmedImageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 767px) 90vw, 480px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
