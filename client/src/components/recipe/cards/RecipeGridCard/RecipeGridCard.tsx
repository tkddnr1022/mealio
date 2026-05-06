import Image from 'next/image';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import type { RecipeSummary } from '@/lib/types/recipe';
import { cn } from '@/lib/utils/cn';
import {
  joinRecipeMetaLine,
  toRecipeCookingTimeLabel,
  toRecipeDetailHref,
  toRecipeDifficultyLabel,
  toRecipeImageUrl,
  toRecipeServingsLabel,
} from '@/components/recipe/utils/recipe-format';

export interface RecipeGridCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  /** `/recipe/{recipeId}` 상세로 이동 */
  recipe: RecipeSummary;
}

/**
 * 그리드용 레시피 카드 (Figma RecipeGridCard, node 166:2030).
 * 이미지 + 제목(H3) + 메타 한 줄(카드 캡션 타이포).
 */
export function RecipeGridCard({
  className = '',
  recipe,
  ...rest
}: RecipeGridCardProps) {
  const imageUrl = toRecipeImageUrl(recipe.imageUrl);
  const title = recipe.title;
  const cookingTime = toRecipeCookingTimeLabel(recipe.cookTime);
  const difficulty = toRecipeDifficultyLabel(recipe.difficulty);
  const servings = toRecipeServingsLabel(recipe.servings);
  const alt = title;
  const metaLine = joinRecipeMetaLine(cookingTime, difficulty, servings);

  const detailHref = toRecipeDetailHref(recipe.id);

  const linkClassName =
    'flex w-full min-w-0 flex-col items-start gap-2 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default select-none';

  return (
    <Link
      href={detailHref}
      className={cn(linkClassName, className)}
      data-name="RecipeGridCard"
      {...rest}
    >
      <article className="contents">
        <div className="w-full shrink-0 overflow-hidden rounded-xl bg-background-placeholder">
          <div className="relative aspect-square w-full">
            <Image
              alt={alt}
              className="object-cover"
              src={imageUrl}
              fill
              sizes="(max-width: 767px) 45vw, 200px"
              unoptimized
            />
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-1">
          <h3 className="line-clamp-2 min-w-0 wrap-break-word style-text-primary">
            {title}
          </h3>
          {metaLine ? (
            <p className="typo-card-caption whitespace-normal style-text-caption">
              {metaLine}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
