import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";

/** Figma LikeButton — `isFavorite`에 따라 채움/윤곽 (Navbar Engage 등). */
export interface LikeButtonProps {
  className?: string;
  onClick?: () => void;
  /** true면 primary 채움(찜) 상태 */
  isFavorite?: boolean;
}

export function LikeButton({
  className = "",
  onClick,
  isFavorite = false,
}: LikeButtonProps) {
  const actionName = isFavorite ? "찜 해제" : "찜하기";
  return (
    <button
      type="button"
      className={cn("touch-target-icon", className)}
      aria-label={buildAriaLabel("button", actionName)}
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
