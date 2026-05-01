import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface AppRootFrameProps {
  className?: string;
  children: ReactNode;
}

/**
 * 프로덕션 앱 루트와 동일한 모바일 프레임(가로 400px 최대폭).
 * 페이지 Story에서도 재사용해 실제 루트 레이아웃과 시각 조건을 맞춘다.
 */
export function AppRootFrame({ className = "", children }: AppRootFrameProps) {
  return (
    <div className={cn("flex h-screen w-full justify-center", className)}>
      <div className="flex flex-col size-full max-w-[400px] overflow-hidden">{children}</div>
    </div>
  );
}
