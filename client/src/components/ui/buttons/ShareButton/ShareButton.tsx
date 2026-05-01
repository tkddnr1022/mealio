import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Figma ShareButton — touch-target-icon, 아이콘 lg. */
export interface ShareButtonProps {
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
}

export function ShareButton({
  className = "",
  onClick,
  "aria-label": ariaLabel = "공유",
}: ShareButtonProps) {
  return (
    <button
      type="button"
      className={cn("touch-target-icon", className)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Share2 className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
