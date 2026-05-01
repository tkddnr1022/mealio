import { Apple, Check, X } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type IngredientCardProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    name?: string;
    selected?: boolean;
    leadingIcon?: ReactNode;
    trailing?: ReactNode;
    onRemove?: () => void;
    removeAriaLabel?: string;
  }
>;

const DEFAULT_ICON = <Apple className="size-5" strokeWidth={2} aria-hidden />;
const CHECK_ICON = <Check className="size-3" strokeWidth={2.25} aria-hidden />;

export function IngredientCard({
  className = "",
  name = "재료명",
  selected = false,
  leadingIcon = DEFAULT_ICON,
  trailing,
  onRemove,
  removeAriaLabel = `${name} 제거`,
  ...rest
}: IngredientCardProps) {
  const defaultTrailing = selected ? (
    <span
      aria-hidden
      className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-toggle-selected-default style-text-button-primary"
    >
      {CHECK_ICON}
    </span>
  ) : onRemove ? (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeAriaLabel}
      className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-background-primary style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
    >
      <X className="size-4" strokeWidth={2.25} aria-hidden />
    </button>
  ) : null;

  return (
    <div
      className={cn(
        "relative flex h-[113px] w-20 shrink-0 flex-col items-center gap-3 rounded-xl bg-background-surface p-4 shadow-(--semantic-shadow-md)",
        className,
      )}
      data-name="IngredientCard"
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-full p-3",
          selected ? "bg-toggle-selected-default style-text-button-primary" : "bg-dropdown-selected-default style-text-accent",
        )}
      >
        {leadingIcon}
      </span>
      <p className="w-full truncate text-center typo-card-body style-text-primary">{name}</p>
      {trailing ?? defaultTrailing}
    </div>
  );
}
