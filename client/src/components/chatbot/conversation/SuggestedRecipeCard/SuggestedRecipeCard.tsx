import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import type { SuggestedRecipe } from '@/lib/types/chatbot';
import { cn } from '@/lib/utils/cn';
import { MiniTagsRow, type MiniTagItem } from '@/components/ui/MiniTagsRow';
import { Thumbnail } from '@/components/ui/Thumbnail';
import {
  toRecipeDetailHref,
  toSuggestedRecipeTagItems,
} from '@/components/chatbot/utils/chatbot-format';
import { buildBlurDataUrl } from '@/lib/utils/image';

const FALLBACK_RECIPE_IMAGE = buildBlurDataUrl({ width: 16, height: 16 });

export interface SuggestedRecipeCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  recipe: SuggestedRecipe;
  imageUrl?: string;
  imageAlt?: string;
  tags?: readonly MiniTagItem[];
}

export function SuggestedRecipeCard({
  className = '',
  recipe,
  imageUrl,
  imageAlt,
  tags,
  ...rest
}: SuggestedRecipeCardProps) {
  const detailHref = toRecipeDetailHref(recipe.id);
  const title = recipe.title;
  const resolvedTags = tags ?? toSuggestedRecipeTagItems(recipe);
  const resolvedImageUrl = imageUrl?.trim() || FALLBACK_RECIPE_IMAGE;

  const linkClassName =
    'block w-full shrink-0 py-2 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

  return (
    <Link
      href={detailHref}
      className={cn(linkClassName, className)}
      data-name="SuggestedRecipeCard"
      data-recipe-id={String(recipe.id)}
      {...rest}
    >
      <article className="contents">
        <div className="card flex flex-col">
          <div className="flex w-full items-center gap-4">
            <div className="w-20 shrink-0 overflow-hidden rounded-lg">
              <Thumbnail
                imageUrl={resolvedImageUrl}
                imageAlt={imageAlt ?? title ?? ''}
                className="rounded-lg"
                square
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <h3 className="w-full truncate typo-card-heading style-text-primary">
                {title ?? ''}
              </h3>
              <MiniTagsRow items={resolvedTags} className="w-full" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
