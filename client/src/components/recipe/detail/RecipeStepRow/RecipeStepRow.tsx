import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface RecipeStepRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
className?: string;
step?: string;
instruction?: string;
}

export function RecipeStepRow({
  className = "",
  step = "1",
  instruction = "Instruction",
  ...rest
}: RecipeStepRowProps) {
  return (
    <div
      className={cn("flex w-full items-start gap-4", className)}
      data-name="RecipeStepRow"
      {...rest}
    >
      <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-background-placeholder">
        <span className="typo-caption-regular style-text-secondary">{step}</span>
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="typo-body-regular style-text-primary">{instruction}</p>
      </div>
    </div>
  );
}
