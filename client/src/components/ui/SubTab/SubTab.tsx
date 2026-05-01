import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SubTabProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    label?: string;
    selected?: boolean;
  }
>;

export function SubTab({
  className = "",
  label = "Label",
  selected = false,
  type = "button",
  ...rest
}: SubTabProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 min-w-px flex-1 items-center justify-center border-b bg-background-surface px-3 py-3 text-center outline-none transition-colors",
        selected
          ? "border-border-accent border-b-2 typo-label-dropdown style-text-tab-active"
          : "border-border-subtle border-b typo-label-dropdown style-text-tab-inactive",
        className,
      )}
      aria-pressed={selected}
      {...rest}
    >
      {label}
    </button>
  );
}
