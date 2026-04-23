import { Clock3, Flame, UsersRound } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { FlatTagsRow } from "@/components/ui/FlatTagsRow";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { LikeButton } from "@/components/ui/buttons/LikeButton";
import { formatCookingTime } from "@/lib/utils/date";

export type RecipeSearchCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    imageUrl: string;
    imageAlt?: string;
    title: string;
    summary?: string;
    cookingTime?: string;
    cookingTimeMinutes?: number;
    difficulty?: string;
    servings?: string;
    isFavorite?: boolean;
    onFavoriteClick?: () => void;
  }
>;

export function RecipeSearchCard({
  className = "",
  imageUrl,
  imageAlt,
  title,
  summary = "설명이 없습니다.",
  cookingTime = "15분",
  cookingTimeMinutes,
  difficulty = "쉬움",
  servings = "2인분",
  isFavorite = false,
  onFavoriteClick,
  ...rest
}: RecipeSearchCardProps) {
  const cookingTimeLabel =
    cookingTimeMinutes !== undefined
      ? (formatCookingTime(cookingTimeMinutes) || cookingTime)
      : cookingTime;

  return (
    <article
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-(--card-radius) bg-background-surface shadow-(--card-elevation)",
        className,
      )}
      data-name="RecipeSearchCard"
      {...rest}
    >
      <div className="relative">
        <Thumbnail
          imageUrl={imageUrl}
          imageAlt={imageAlt ?? title}
          square={false}
        />
        <div className="absolute top-4 right-4 rounded-full bg-background-surface shadow-(--semantic-shadow-sm)">
          <LikeButton
            isFavorite={isFavorite}
            onClick={onFavoriteClick}
            aria-label={isFavorite ? "찜 해제" : "찜하기"}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-(--card-gap) p-(--card-padding)">
        <FlatTagsRow
          items={[
            {
              label: cookingTimeLabel,
              leftIcon: (
                <Clock3 className="size-4 p-px" strokeWidth={2} aria-hidden />
              ),
            },
            {
              label: difficulty,
              leftIcon: (
                <Flame className="size-4 p-px" strokeWidth={2} aria-hidden />
              ),
            },
            {
              label: servings,
              leftIcon: (
                <UsersRound className="size-4 p-px" strokeWidth={2} aria-hidden />
              ),
            },
          ]}
        />
        <div className="flex w-full flex-col gap-1">
          <h3 className="typo-card-heading style-text-primary">{title}</h3>
          <p className="typo-card-body style-text-secondary">{summary}</p>
        </div>
      </div>
    </article>
  );
}
