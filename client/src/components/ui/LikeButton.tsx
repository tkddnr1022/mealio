import { Heart } from "lucide-react";

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
      className={`touch-target-icon ${className}`.trim()}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      onClick={onClick}
    >
      <Heart
        className={`size-6 ${isFavorite ? "fill-primary text-primary" : ""}`.trim()}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
