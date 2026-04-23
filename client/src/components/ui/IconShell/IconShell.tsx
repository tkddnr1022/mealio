import { Search } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type IconShellVariant = "primary" | "accent" | "muted" | "secondary";
export type IconShellSize = "small" | "medium" | "large" | "xlarge";

export type IconShellProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    variant?: IconShellVariant;
    size?: IconShellSize;
    icon?: ReactNode;
  }
>;

const shellSizeClassMap: Record<IconShellSize, string> = {
  small: "p-1",
  medium: "p-2",
  large: "p-3",
  xlarge: "p-4",
};

const iconSizeClassMap: Record<IconShellSize, string> = {
  small: "size-4",
  medium: "size-5",
  large: "size-6",
  xlarge: "size-8",
};

const toneClassMap: Record<IconShellVariant, string> = {
  primary: "bg-toggle-selected-default style-text-toggle-active",
  accent: "bg-dropdown-selected-default style-text-accent",
  muted: "bg-background-placeholder style-text-disabled",
  secondary: "bg-background-primary style-text-secondary",
};

export function IconShell({
  className = "",
  variant = "primary",
  size = "small",
  icon,
  ...rest
}: IconShellProps) {
  const renderedIcon = icon ?? (
    <Search className={iconSizeClassMap[size]} strokeWidth={2} aria-hidden />
  );

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full [&_svg]:shrink-0 [&_svg]:stroke-current",
        shellSizeClassMap[size],
        toneClassMap[variant],
        className,
      )}
      data-name="IconShell"
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {renderedIcon}
    </div>
  );
}
