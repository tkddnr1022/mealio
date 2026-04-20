import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

import { PaginationDot } from "@/components/ui/PaginationDot";

export type SliderPaginationProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** 인디케이터(점) 개수 — 슬라이드·페이지 수 */
    total: number;
    /** 현재 활성 인덱스 (0부터) */
    activeIndex: number;
  }
>;

/**
 * 슬라이더·캐러셀용 점 묶음 (Figma SliderPagination, node 198:1388).
 * `PaginationDot`을 가로로 배치하고 `activeIndex`에 맞춰 활성 pill을 표시한다.
 */
export function SliderPagination({
  className = "",
  total,
  activeIndex,
  ...rest
}: SliderPaginationProps) {
  const safeTotal = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const rawIndex = Number.isFinite(activeIndex) ? Math.floor(activeIndex) : 0;
  const clampedIndex =
    safeTotal === 0 ? 0 : Math.min(Math.max(0, rawIndex), safeTotal - 1);

  if (safeTotal === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex w-full items-center justify-center gap-2", className)}
      data-name="SliderPagination"
      role="group"
      aria-label={`슬라이드 ${clampedIndex + 1} / ${safeTotal}`}
      {...rest}
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <PaginationDot
          key={i}
          active={i === clampedIndex}
          aria-current={i === clampedIndex ? "true" : undefined}
          aria-hidden={i === clampedIndex ? undefined : true}
        />
      ))}
    </div>
  );
}
