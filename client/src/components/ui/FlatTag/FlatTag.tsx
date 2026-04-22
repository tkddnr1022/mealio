import { Clock3 } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type FlatTagProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    className?: string;
    label?: string;
    accent?: boolean;
    leftIcon?: ReactNode;
    trailing?: ReactNode;
  }
>;

export function FlatTag({
  className = "",
  label = "Label",
  accent = false,
  leftIcon = <Clock3 className="size-4 p-px" strokeWidth={2} aria-hidden />,
  trailing,
  ...rest
}: FlatTagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2",
        accent ? "bg-tag-accent style-text-accent" : "bg-tag-default style-text-secondary",
        className,
      )}
      data-name="FlatTag"
      {...rest}
    >
      {leftIcon}
      <span className="typo-caption-regular">{label}</span>
      {trailing}
    </div>
  );
}
