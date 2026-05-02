import Image from 'next/image';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatCookingTime } from '@/lib/utils/date';

export interface RecipeGridCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  /** `/recipe/{recipeId}` 상세로 이동 */
  recipeId: string;
  imageUrl: string;
  imageAlt?: string;
  title: string;
  cookingTime?: string;
  cookingTimeMinutes?: number;
  difficulty?: string;
  servings?: string;
  category?: string;
}

function buildMetaLine(
  cookingTime: string | undefined,
  difficulty: string | undefined,
  servings: string | undefined,
  category: string | undefined,
): string | null {
  const parts = [cookingTime, difficulty, servings, category].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  );
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

/**
 * 그리드용 레시피 카드 (Figma RecipeGridCard, node 166:2030).
 * 이미지 + 제목(H3) + 메타 한 줄(카드 캡션 타이포).
 */
export function RecipeGridCard({
  className = '',
  recipeId,
  imageUrl,
  imageAlt,
  title,
  cookingTime,
  cookingTimeMinutes,
  difficulty,
  servings,
  category,
  ...rest
}: RecipeGridCardProps) {
  const alt = imageAlt?.trim() || title;
  const cookingTimeLabel =
    cookingTimeMinutes !== undefined
      ? formatCookingTime(cookingTimeMinutes) || cookingTime
      : cookingTime;
  const metaLine = buildMetaLine(
    cookingTimeLabel,
    difficulty,
    servings,
    category,
  );

  const detailHref = `/recipe/${encodeURIComponent(recipeId)}`;

  const linkClassName =
    'flex w-full min-w-0 flex-col items-start gap-2 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default';

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
