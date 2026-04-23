import { Clock3 } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type CardTagProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    label?: string;
    leftIcon?: ReactNode;
    trailing?: ReactNode;
  }
>;

export function CardTag({
  className = "",
  label = "Label",
  leftIcon = <Clock3 className="size-5 p-0.5 style-text-accent" strokeWidth={2} aria-hidden />,
  trailing,
  ...rest
}: CardTagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-background-surface px-4 py-2 shadow-[var(--semantic-shadow-sm)]",
        className,
      )}
      data-name="CardTag"
      {...rest}
    >
      {leftIcon}
      <span className="typo-body-regular style-text-primary">{label}</span>
      {trailing}
    </div>
  );
}
