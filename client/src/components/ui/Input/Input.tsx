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

export type InputProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> & {
    className?: string;
    /** pill 외곽 컨테이너에 붙는 클래스 */
    wrapperClassName?: string;
    /** 컨테이너 루트에 전달 (data-* 등). className·children 제외 */
    wrapperProps?: InputShellProps;
    /** 왼쪽 슬롯(아이콘). 24×24 영역에 맞춰 배치 */
    startAdornment?: ReactNode;
    /** 오른쪽 슬롯(클리어 등) */
    endAdornment?: ReactNode;
    /**
     * Figma Input: `transition-shadow`, focus-within 시 Border/Accent 링(`--border-width-focus`).
     * `readOnly` 트리거(예: SearchBarHeader)처럼 상위가 포커스 링을 줄 때 false.
     */
    focusWithinRing?: boolean;
  }
>;

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
