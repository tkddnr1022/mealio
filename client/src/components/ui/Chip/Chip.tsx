import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";

export interface ChipProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> {
  className?: string;
  label?: string;
  onRemove?: () => void;
}

export function Chip({ className = "", label, onRemove, ...rest }: ChipProps) {
  const labelText = (label ?? "").trim();
  const removeButtonAriaLabel =
    onRemove !== undefined
      ? buildAriaLabel("button", labelText ? `${labelText} 제거` : "")
      : undefined;

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
          aria-label={removeButtonAriaLabel}
          className="inline-flex size-5 p-[2px] items-center justify-center rounded-full style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
        >
          <X strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span
          aria-hidden
          className="inline-flex size-5 p-[2px] items-center justify-center style-text-secondary"
        >
          <X strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
