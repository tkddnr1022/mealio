import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";

/** Figma ShareButton — touch-target-icon, 아이콘 lg. */
export interface ShareButtonProps {
  className?: string;
  onClick?: () => void;
}

export function ShareButton({
  className = "",
  onClick,
}: ShareButtonProps) {
  return (
    <button
      type="button"
      className={cn("touch-target-icon", className)}
      aria-label={buildAriaLabel("button", "공유")}
      onClick={onClick}
    >
      <Share2 className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
