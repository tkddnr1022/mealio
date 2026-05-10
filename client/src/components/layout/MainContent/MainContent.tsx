'use client';

import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils/cn';
import { CustomScrollbar } from '@/components/ui/CustomScrollbar';

/**
 * Figma `MainContent` (node 166:1227): Background/Primary → `bg-background-primary`, 세로 플렉스 영역.
 * Navbar·하단 탭 사이 본문에 두면 `flex-1`·`min-h-0`로 남는 높이를 채우고 내부만 스크롤됩니다.
 */
export interface MainContentProps {
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
  /**
   * 스크롤 트랙의 맨 아래(본문 `padding` 바깥)에 두는 앵커.
   * 부모에서 `scrollIntoView`로 스크롤을 끝까지 맞출 때 사용한다.
   */
  scrollEndRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

export function MainContent({
  className = '',
  innerClassName = '',
  centered = false,
  paddingX = true,
  paddingY = true,
  scroll = true,
  scrollEndRef,
  children,
}: MainContentProps) {
  const paddedInnerClasses = cn(
    'flex w-full flex-col gap-8',
    centered && 'items-center justify-center',
    paddingX && 'px-4',
    paddingY && 'py-6',
    innerClassName,
  );

  const scrollTrackClasses =
    scrollEndRef != null
      ? 'flex min-h-0 flex-col'
      : paddedInnerClasses;

  const paddedBodyClass =
    scrollEndRef != null
      ? cn(paddedInnerClasses, centered && 'min-h-0 flex-1')
      : paddedInnerClasses;

  const scrollEndAnchor =
    scrollEndRef != null ? (
      <div
        ref={scrollEndRef}
        className="h-px w-full shrink-0"
        aria-hidden
      />
    ) : null;

  return (
    <main
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background-primary',
        className,
      )}
    >
      {scroll ? (
        <CustomScrollbar className={scrollTrackClasses}>
          {scrollEndRef != null ? (
            <>
              <div className={paddedBodyClass}>{children}</div>
              {scrollEndAnchor}
            </>
          ) : (
            children
          )}
        </CustomScrollbar>
      ) : (
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto',
            scrollTrackClasses,
          )}
        >
          {scrollEndRef != null ? (
            <>
              <div className={paddedBodyClass}>{children}</div>
              {scrollEndAnchor}
            </>
          ) : (
            children
          )}
        </div>
      )}
    </main>
  );
}
