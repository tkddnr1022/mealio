import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { MiniTagsRow, type MiniTagItem } from "@/components/ui/MiniTagsRow";
import { Thumbnail } from "@/components/ui/Thumbnail";

export type SuggestedRecipeCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    title?: string;
    imageUrl?: string;
    imageAlt?: string;
    tags?: readonly MiniTagItem[];
  }
>;

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=320&h=320&fit=crop";

const DEFAULT_TAGS: readonly MiniTagItem[] = [
  { label: "15분" },
  { label: "쉬움" },
  { label: "2인분" },
];

export function SuggestedRecipeCard({
  className = "",
  title = "비빔밥",
  imageUrl = DEFAULT_IMAGE_URL,
  imageAlt,
  tags = DEFAULT_TAGS,
  ...rest
}: SuggestedRecipeCardProps) {
  return (
    <article
      className={cn("w-full shrink-0 py-2", className)}
      data-name="SuggestedRecipeCard"
      {...rest}
    >
      <div className="card flex flex-col">
        <div className="flex w-full items-center gap-4">
          <div className="w-20 shrink-0 overflow-hidden rounded-lg">
            <Thumbnail
              imageUrl={imageUrl}
              imageAlt={imageAlt ?? title}
              className="rounded-lg"
              square
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <h3 className="w-full truncate typo-card-heading style-text-primary">{title}</h3>
            <MiniTagsRow items={tags} className="w-full" />
          </div>
        </div>
      </div>
    </article>
  );
}
