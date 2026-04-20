import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { FlatRow } from "@/components/ui/FlatRow";

export type ToggleCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className"> & {
    className?: string;
    heading?: string;
  }
>;

export function ToggleCard({
  className = "",
  heading = "Heading",
  children,
  ...rest
}: ToggleCardProps) {
  return (
    <section
      className={cn(
        "card flex w-full flex-col",
        className,
      )}
      data-name="ToggleCard"
      {...rest}
    >
      <h3 className="text-text-primary">{heading}</h3>
      <FlatRow>{children}</FlatRow>
    </section>
  );
}
