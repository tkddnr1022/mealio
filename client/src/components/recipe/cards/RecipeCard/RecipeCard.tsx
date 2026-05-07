import { Clock3, Flame, UsersRound } from 'lucide-react';
import Link from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';
import type { RecipeSummary } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import { FlatTagsRow } from '@/components/ui/FlatTagsRow';
import { Thumbnail } from '@/components/ui/Thumbnail';
import {
  toRecipeCookingTimeLabel,
  toRecipeDetailHref,
  toRecipeDifficultyLabel,
  toRecipeImageUrl,
  toRecipeServingsLabel,
} from '@/components/recipe/utils/recipe-format';

export interface RecipeCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  /** `/recipe/{recipeId}` 상세로 이동 (좋아요 버튼은 링크 밖) */
  recipe: RecipeSummary;
  favoriteButtonRenderer?: (recipe: RecipeSummary) => ReactNode;
}

export function RecipeCard({
  className = '',
  recipe,
  favoriteButtonRenderer,
  ...rest
}: RecipeCardProps) {
  const imageUrl = toRecipeImageUrl(recipe.imageUrl);
  const imageAlt = recipe.title;
  const title = recipe.title;
  const summary = recipe.description ?? '';
  const cookingTimeLabel = toRecipeCookingTimeLabel(recipe.cookTime);
  const difficulty = toRecipeDifficultyLabel(recipe.difficulty);
  const servings = toRecipeServingsLabel(recipe.servings);
  const tagItems = [
    cookingTimeLabel
      ? {
          label: cookingTimeLabel,
          leftIcon: (
            <Clock3 className="size-4 p-px" strokeWidth={2} aria-hidden />
          ),
        }
      : null,
    difficulty
      ? {
          label: difficulty,
          leftIcon: (
            <Flame className="size-4 p-px" strokeWidth={2} aria-hidden />
          ),
        }
      : null,
    servings
      ? {
          label: servings,
          leftIcon: (
            <UsersRound className="size-4 p-px" strokeWidth={2} aria-hidden />
          ),
        }
      : null,
  ].filter((item) => item !== null);

  const detailHref = toRecipeDetailHref(recipe.id);

  const linkClassName =
    'flex w-full flex-col overflow-hidden rounded-(--card-radius) bg-background-surface shadow-(--card-elevation) text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

  return (
    <div className="relative w-full">
      <Link
        href={detailHref}
        className={cn(linkClassName, className)}
        data-name="RecipeCard"
        {...rest}
      >
        <article className="contents">
          <div className="relative">
            <Thumbnail
              imageUrl={imageUrl}
              imageAlt={imageAlt ?? title}
              square={false}
            />
          </div>

          <div className="flex w-full flex-col gap-(--card-gap) p-(--card-padding)">
            <FlatTagsRow items={tagItems} />
            <div className="flex w-full flex-col gap-1">
              <h3 className="typo-card-heading style-text-primary">{title}</h3>
              <p className="typo-card-body style-text-secondary">
                {summary ?? ''}
              </p>
            </div>
          </div>
        </article>
      </Link>
      <div className="absolute right-4 top-4 z-10 rounded-full bg-background-surface shadow-(--semantic-shadow-sm)">
        {favoriteButtonRenderer?.(recipe)}
      </div>
    </div>
  );
}
