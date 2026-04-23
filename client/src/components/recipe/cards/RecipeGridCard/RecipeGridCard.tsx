import Image from "next/image";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCookingTime } from "@/lib/utils/date";

export type RecipeGridCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** 레시피 대표 이미지 URL */
    imageUrl: string;
    /** 이미지 대체 텍스트 (없으면 title 사용) */
    imageAlt?: string;
    /** 레시피 제목 */
    title: string;
    /** 조리 시간 라벨 (예: 45분) */
    cookingTime?: string;
    /** 조리 시간(분). 있으면 `formatCookingTime`으로 우선 표기 */
    cookingTimeMinutes?: number;
    /** 난이도 라벨 (예: 쉬움) */
    difficulty?: string;
    /** 인분 라벨 (예: 4인분) */
    servings?: string;
    /** 카테고리·태그 라벨 (예: 아시안) */
    category?: string;
  }
>;

function buildMetaLine(
  cookingTime: string | undefined,
  difficulty: string | undefined,
  servings: string | undefined,
  category: string | undefined,
): string | null {
  const parts = [cookingTime, difficulty, servings, category].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

/**
 * 그리드용 레시피 카드 (Figma RecipeGridCard, node 166:2030).
 * 이미지 + 제목(H3) + 메타 한 줄(카드 캡션 타이포).
 */
export function RecipeGridCard({
  className = "",
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
      ? (formatCookingTime(cookingTimeMinutes) || cookingTime)
      : cookingTime;
  const metaLine = buildMetaLine(
    cookingTimeLabel,
    difficulty,
    servings,
    category,
  );

  return (
    <article
      className={cn("flex w-full min-w-0 flex-col items-start gap-2", className)}
      data-name="RecipeGridCard"
      {...rest}
    >
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
  );
}
