import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface FlatRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
className?: string;
}

/**
 * 토글/태그 묶음용 유동 행 컨테이너.
 * Figma FlatRow 높이(85px)를 최소 높이로 유지하고, 줄바꿈 가능한 래핑 레이아웃을 제공한다.
 */
export function FlatRow({ className = "", children, ...rest }: FlatRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-[85px] w-full flex-wrap content-start items-start gap-2",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
