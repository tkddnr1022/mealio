import type { HTMLAttributes } from 'react';
import { NavLink } from '@/components/ui/NavLink';
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

export interface SuggestedRecipeBubbleProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  recipe: SuggestedRecipe;
  imageUrl?: string;
  imageAlt?: string;
  tags?: readonly MiniTagItem[];
}

export function SuggestedRecipeBubble({
  className = '',
  recipe,
  imageUrl,
  imageAlt,
  tags,
  ...rest
}: SuggestedRecipeBubbleProps) {
  const detailHref = toRecipeDetailHref(recipe.id);
  const title = recipe.title;
  const resolvedTags = tags ?? toSuggestedRecipeTagItems(recipe);
  const resolvedImageUrl = imageUrl?.trim() || FALLBACK_RECIPE_IMAGE;

  const linkClassName =
    'block w-full shrink-0 py-2 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default select-none';

  return (
    <NavLink
      href={detailHref}
      className={cn(linkClassName, className)}
      data-name="SuggestedRecipeBubble"
      data-recipe-id={String(recipe.id)}
      {...rest}
    >
      <article className="contents">
        <div className="flex flex-col overflow-hidden rounded-2xl bg-background-surface p-4 shadow-(--semantic-shadow-md)">
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
              <h3 className="w-full truncate typo-h3 style-text-primary">
                {title ?? ''}
              </h3>
              <MiniTagsRow items={resolvedTags} className="w-full" />
            </div>
          </div>
        </div>
      </article>
    </NavLink>
  );
}
