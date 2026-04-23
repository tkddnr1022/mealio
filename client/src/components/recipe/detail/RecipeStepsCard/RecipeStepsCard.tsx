import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { RecipeStepRow, type RecipeStepRowProps } from "@/components/recipe/detail/RecipeStepRow";

export type RecipeStepItem = Readonly<{
  step: string;
  instruction: string;
}>;

export type RecipeStepsCardProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    title?: string;
    steps?: readonly RecipeStepItem[];
    rowClassName?: string;
    rowProps?: Omit<RecipeStepRowProps, "step" | "instruction" | "className">;
  }
>;

const defaultSteps: readonly RecipeStepItem[] = [
  { step: "1", instruction: "첫 번째 조리 단계입니다." },
  { step: "2", instruction: "다음 단계를 진행합니다." },
];

export function RecipeStepsCard({
  className = "",
  title = "조리 순서",
  steps = defaultSteps,
  rowClassName = "",
  rowProps,
  ...rest
}: RecipeStepsCardProps) {
  return (
    <section
      className={cn("card flex w-full flex-col", className)}
      data-name="RecipeStepsCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <div className="flex w-full flex-col gap-4">
        {steps.map((item, index) => (
          <RecipeStepRow
            key={`${item.step}-${index}`}
            step={item.step}
            instruction={item.instruction}
            className={rowClassName}
            {...rowProps}
          />
        ))}
      </div>
    </section>
  );
}
