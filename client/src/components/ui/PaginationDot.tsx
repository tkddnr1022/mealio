import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type PaginationDotProps = Readonly<
  Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** 활성(현재 슬라이드·페이지) 여부 — true면 가로로 긴 pill, false면 원형 */
    active?: boolean;
  }
>;

/**
 * 캐러셀·온보딩 등 페이지 인디케이터 점 (Figma PaginationDot, node 198:1397).
 * 비활성: 8px 원 (`indicator-inactive`) / 활성: 8×24px pill, primary 색.
 */
export function PaginationDot({
  className = "",
  active = false,
  ...rest
}: PaginationDotProps) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full transition-[width,background-color] duration-200 ease-out",
        active ? "h-2 w-6 bg-primary" : "size-2 bg-indicator-inactive",
        className,
      )}
      data-name="PaginationDot"
      data-active={active ? "true" : "false"}
      {...rest}
    />
  );
}
