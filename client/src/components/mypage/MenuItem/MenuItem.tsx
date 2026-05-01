import { ChevronRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type MenuItemProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    border?: boolean;
    label?: string;
    leadingIcon?: ReactNode;
  }
>;

export function MenuItem({
  className = "",
  border = false,
  label,
  leadingIcon,
  type = "button",
  ...rest
}: MenuItemProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex w-full items-center gap-4 bg-background-surface text-left outline-none",
        border ? "border-b border-border-muted pb-[17px] pt-4" : "py-4",
        className,
      )}
      data-name="MenuItem"
      {...rest}
    >
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-dropdown-selected-default style-text-accent"
      >
        {leadingIcon}
      </span>
      <span className="min-w-px flex-1 typo-label-toggle style-text-primary">{label}</span>
      <ChevronRight className="size-5 shrink-0 text-primary-inactive" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
