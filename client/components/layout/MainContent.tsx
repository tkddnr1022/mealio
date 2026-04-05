import type { ReactNode } from "react";

/**
 * Figma `MainContent` (node 166:1227): Background/Primary `#FAFAF9`, 세로 플렉스 영역.
 * Navbar·하단 탭 사이 본문에 두면 `flex-1`·`min-h-0`로 남는 높이를 채우고 내부만 스크롤됩니다.
 */
export type MainContentProps = Readonly<{
  className?: string;
  innerClassName?: string;
  /** 기본 `px-4`. 가로 풀블리드 등에서 `false`. */
  paddingX?: boolean;
  /** 기본 `py-6`. 세로만 풀블리드할 때 `false`. */
  paddingY?: boolean;
  children?: ReactNode;
}>;

export function MainContent({
  className = "",
  innerClassName = "",
  paddingX = true,
  paddingY = true,
  children,
}: MainContentProps) {
  return (
    <main
      className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background ${className}`.trim()}
    >
      <div
        className={[
          "relative flex flex-col gap-8 min-h-0 w-full flex-1 overflow-y-auto",
          paddingX && "px-4",
          paddingY && "py-6",
          innerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
