import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "large" | "medium";

export type ButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    label?: string;
  }
>;

export function Button({
  className = "",
  variant = "primary",
  size = "large",
  label = "Label",
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = !!disabled;

  const baseClassName =
    "inline-flex w-full items-center justify-center px-4 outline-none transition-colors";
  const sizeClassName =
    size === "large"
      ? "rounded-full py-3 typography-label-button"
      : "rounded-xl py-3 typography-label-dropdown";

  const toneClassName =
    variant === "primary"
      ? isDisabled
        ? "bg-primary-inactive text-text-disabled"
        : "bg-primary text-on-primary hover:bg-primary-hover"
      : "bg-secondary text-on-secondary hover:bg-secondary-hover";

  return (
    <button
      type={type}
      className={cn(baseClassName, sizeClassName, toneClassName, className)}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {children ?? label}
    </button>
  );
}
