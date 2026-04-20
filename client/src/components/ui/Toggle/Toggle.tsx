import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ToggleSize = "large" | "medium";

export type ToggleProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    label?: string;
    selected?: boolean;
    size?: ToggleSize;
  }
>;

export function Toggle({
  className = "",
  label = "Label",
  selected = false,
  size = "large",
  type = "button",
  children,
  ...rest
}: ToggleProps) {
  const sizeClassName =
    size === "large"
      ? "rounded-full px-4 py-2 text-body"
      : "w-full rounded-xl px-4 py-3 typography-label-dropdown";

  const stateClassName = selected
    ? "bg-toggle-selected text-on-primary hover:bg-toggle-selected-hover"
    : "bg-toggle-unselected text-text-secondary hover:bg-toggle-unselected-hover";

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium text-center outline-none transition-colors",
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
