import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Figma AddButton — Navbar 우측 추가 등 (touch-target-icon, 아이콘 lg). */
export type AddButtonProps = Readonly<{
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
}>;

export function AddButton({
  className = "",
  onClick,
  "aria-label": ariaLabel = "추가",
}: AddButtonProps) {
  return (
    <button
      type="button"
      className={cn("touch-target-icon", className)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Plus className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
