import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type DropdownButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    label?: string;
    open?: boolean;
  }
>;

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="size-5 style-text-secondary"
    >
      <path
        d="M6.667 8.333 10 11.667l3.333-3.334"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="size-5 style-text-secondary"
    >
      <path
        d="M6.667 11.667 10 8.333l3.333 3.334"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DropdownButton({
  className = "",
  label = "Label",
  open = false,
  type = "button",
  children,
  ...rest
}: DropdownButtonProps) {
  return (
    <button
      type={type}
      aria-expanded={open}
      className={cn(
        "typo-label-dropdown inline-flex items-center gap-2 rounded-lg bg-background-primary px-3 py-2 style-text-primary outline-none transition-colors hover:bg-background-placeholder focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary-default focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary",
        className,
      )}
      {...rest}
    >
      <span>{children ?? label}</span>
      {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </button>
  );
}
