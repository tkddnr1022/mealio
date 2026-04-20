"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";

/**
 * Figma `MainContent` (node 166:1227): Background/Primary → `bg-background`, 세로 플렉스 영역.
 * Navbar·하단 탭 사이 본문에 두면 `flex-1`·`min-h-0`로 남는 높이를 채우고 내부만 스크롤됩니다.
 */
export type MainContentProps = Readonly<{
  className?: string;
  innerClassName?: string;
  /** true면 내부 스택을 가로 중앙 정렬 */
  centered?: boolean;
  /** 기본 `px-4`. 가로 풀블리드 등에서 `false`. */
  paddingX?: boolean;
  /** 기본 `py-6`. 세로만 풀블리드할 때 `false`. */
  paddingY?: boolean;
  /**
   * Figma MainContent: `true`면 커스텀 스크롤바(`CustomScrollbar`),
   * `false`면 네이티브 세로 스크롤만(오버레이 트랙 없음).
   */
  scroll?: boolean;
  children?: ReactNode;
}>;

export function MainContent({
  className = "",
  innerClassName = "",
  centered = false,
  paddingX = true,
  paddingY = true,
  scroll = true,
  children,
}: MainContentProps) {
  const innerClasses = cn(
    "flex flex-col gap-8",
    centered && "items-center justify-center",
    paddingX && "px-4",
    paddingY && "py-6",
    innerClassName,
  );

  return (
    <main className={cn("flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background", className)}>
      {scroll ? (
        <CustomScrollbar className={innerClasses}>{children}</CustomScrollbar>
      ) : (
        <div className={cn("min-h-0 flex-1 overflow-y-auto", innerClasses)}>
          {children}
        </div>
      )}
    </main>
  );
}
