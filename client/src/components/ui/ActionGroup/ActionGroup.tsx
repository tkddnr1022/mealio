import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { Button, type ButtonProps } from "@/components/ui/Button";

export type ActionGroupProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "className"> & {
    className?: string;
    leftButtonProps?: Omit<ButtonProps, "className" | "size">;
    rightButtonProps?: Omit<ButtonProps, "className" | "size">;
  }
>;

export function ActionGroup({
  className = "",
  leftButtonProps,
  rightButtonProps,
  ...rest
}: ActionGroupProps) {
  return (
    <section
      className={cn(
        "flex w-full items-start gap-4 border-t border-border-subtle bg-background-surface px-4 py-3",
        className,
      )}
      data-name="ActionGroup"
      {...rest}
    >
      <Button
        size="large"
        variant="secondary"
        label="Label"
        className="flex-1"
        {...leftButtonProps}
      />
      <Button
        size="large"
        variant="primary"
        label="Label"
        className="flex-1"
        {...rightButtonProps}
      />
    </section>
  );
}
