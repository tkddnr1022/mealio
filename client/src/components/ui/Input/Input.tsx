"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

export type InputShellProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "className" | "children"
>;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
className?: string;
wrapperClassName?: string;
wrapperProps?: InputShellProps;
startAdornment?: ReactNode;
endAdornment?: ReactNode;
focusWithinRing?: boolean;
}

const focusWithinRingClasses =
  "focus-within:outline-none focus-within:ring-(length:--border-width-focus) focus-within:ring-primary-default focus-within:ring-offset-2 focus-within:ring-offset-background-primary";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className = "",
    wrapperClassName = "",
    wrapperProps,
    startAdornment,
    endAdornment,
    focusWithinRing = true,
    disabled,
    ...inputProps
  },
  ref,
) {
  return (
    <div
      {...wrapperProps}
      className={cn(
        "flex w-full items-center gap-3 rounded-full bg-background-primary px-4 py-3 transition-shadow [&:has(input:disabled)]:opacity-50",
        focusWithinRing ? focusWithinRingClasses : "outline-none",
        wrapperClassName,
      )}
    >
      {startAdornment ? (
        <div
          className="flex size-6 shrink-0 flex-col items-center justify-center overflow-hidden"
          aria-hidden
        >
          {startAdornment}
        </div>
      ) : null}
      <input
        ref={ref}
        {...inputProps}
        disabled={disabled}
        className={cn(
          "placeholder:typo-search-bar-value min-h-0 min-w-0 flex-1 bg-transparent style-text-primary outline-none placeholder:style-text-placeholder disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
      />
      {endAdornment ? (
        <div className="flex shrink-0 items-center justify-center">{endAdornment}</div>
      ) : null}
    </div>
  );
});
