import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { MiniTagsRow, type MiniTagItem } from "@/components/ui/MiniTagsRow";
import { Thumbnail } from "@/components/ui/Thumbnail";

export interface SuggestedRecipeCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  className?: string;
  /** OpenAPI `SuggestedRecipe.id`와 동일 */
  recipeId: number;
  title?: string;
  imageUrl: string;
  imageAlt?: string;
  tags?: readonly MiniTagItem[];
}

export function SuggestedRecipeCard({
  className = "",
  recipeId,
  title,
  imageUrl,
  imageAlt,
  tags = [],
  ...rest
}: SuggestedRecipeCardProps) {
  const detailHref = `/recipe/${encodeURIComponent(String(recipeId))}`;

  const linkClassName =
    "block w-full shrink-0 py-2 text-inherit no-underline outline-none transition-[opacity,colors] focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default";

  return (
    <Link
      href={detailHref}
      className={cn(linkClassName, className)}
      data-name="SuggestedRecipeCard"
      data-recipe-id={String(recipeId)}
      {...rest}
    >
      <article className="contents">
        <div className="card flex flex-col">
          <div className="flex w-full items-center gap-4">
            <div className="w-20 shrink-0 overflow-hidden rounded-lg">
              <Thumbnail
                imageUrl={imageUrl}
                imageAlt={imageAlt ?? title ?? ""}
                className="rounded-lg"
                square
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <h3 className="w-full truncate typo-card-heading style-text-primary">{title ?? ""}</h3>
              <MiniTagsRow items={tags} className="w-full" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
