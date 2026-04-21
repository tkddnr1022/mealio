import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Figma LikeButton — `isFavorite`에 따라 채움/윤곽 (Navbar Engage 등). */
export type LikeButtonProps = Readonly<{
  className?: string;
  onClick?: () => void;
  /** true면 primary 채움(찜) 상태 */
  isFavorite?: boolean;
  "aria-label"?: string;
}>;

export function LikeButton({
  className = "",
  onClick,
  isFavorite = false,
  "aria-label": ariaLabel = "좋아요",
}: LikeButtonProps) {
  return (
    <button
      type="button"
      className={cn("touch-target-icon", className)}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      onClick={onClick}
    >
      <Heart
        className={cn("size-6", isFavorite && "fill-primary-default style-text-accent")}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
