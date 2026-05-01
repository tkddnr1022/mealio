import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ToggleSize = "large" | "medium";

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
className?: string;
label?: string;
selected?: boolean;
size?: ToggleSize;
}

export function Toggle({
  className = "",
  label,
  selected = false,
  size = "large",
  type = "button",
  children,
  ...rest
}: ToggleProps) {
  const sizeClassName =
    size === "large"
      ? "rounded-full px-4 py-2 typo-label-toggle"
      : "w-full rounded-xl px-4 py-3 typo-label-tab";

  const stateClassName = selected
    ? "bg-toggle-selected-default style-text-button-primary hover:bg-toggle-selected-hover"
    : "bg-toggle-unselected-default style-text-secondary hover:bg-toggle-unselected-hover";

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center text-center outline-none transition-colors",
        sizeClassName,
        stateClassName,
        className,
      )}
      aria-pressed={selected}
      {...rest}
    >
      {children ?? label}
    </button>
  );
}
