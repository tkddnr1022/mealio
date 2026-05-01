import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
icon?: ReactNode;
value?: string;
label?: string;
}

export function StatCard({
  className = "",
  icon,
  value,
  label,
  ...rest
}: StatCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-(--card-radius) bg-background-surface p-(--card-padding) shadow-(--card-elevation)",
        className,
      )}
      data-name="StatCard"
      {...rest}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="style-text-accent">
          {icon}
        </span>
        <p className="typo-body-bold style-text-primary">{value}</p>
      </div>
      <p className="typo-small style-text-placeholder">{label}</p>
    </article>
  );
}
