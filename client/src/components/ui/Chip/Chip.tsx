import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ChipProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    label?: string;
    onRemove?: () => void;
    removeAriaLabel?: string;
  }
>;

export function Chip({
  className = "",
  label = "Label",
  onRemove,
  removeAriaLabel = `${label} 제거`,
  ...rest
}: ChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-chip-default px-4 py-2 transition-colors hover:bg-chip-hover",
        className,
      )}
      data-name="Chip"
      {...rest}
    >
      <span className="typo-caption-regular style-text-primary">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeAriaLabel}
          className="inline-flex size-5 p-[2px] items-center justify-center rounded-full style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
        >
          <X className="size-full" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span
          aria-hidden
          className="inline-flex size-5 p-[2px] items-center justify-center style-text-secondary"
        >
          <X className="size-full" strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
