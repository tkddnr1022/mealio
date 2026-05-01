import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { RangeSlider, type RangeSliderProps } from "@/components/ui/RangeSlider";

export interface RangeSliderCardProps extends Omit<HTMLAttributes<HTMLElement>, "className"> {
className?: string;
heading?: string;
sliderProps?: Omit<RangeSliderProps, "className">;
}

export function RangeSliderCard({
  className = "",
  heading = "Heading",
  sliderProps,
  ...rest
}: RangeSliderCardProps) {
  return (
    <section
      className={cn("card flex w-full flex-col", className)}
      data-name="RangeSliderCard"
      {...rest}
    >
      <h3 className="typo-card-heading style-text-primary">{heading}</h3>
      <RangeSlider {...sliderProps} />
    </section>
  );
}
