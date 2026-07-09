'use client';

import { sendGAEvent } from '@next/third-parties/google';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { env } from '@/lib/config/env';
import { cn } from '@/lib/utils/cn';

const SCROLLBAR_THUMB_HEIGHT_SCALE = 1;
const SCROLLBAR_VISIBLE_DURATION_MS = 1500;
const SCROLLBAR_TRACK_INSET_PX = 8;
/** GA4 Enhanced Measurement scroll 이벤트와 동일한 임계치(%) */
const GA_SCROLL_DEPTH_THRESHOLD = 90;

interface DragState {
  clientY: number;
  scrollTop: number;
  maxScrollTop: number;
  maxThumbOffset: number;
}

function getScrollDepthPercent(el: HTMLElement): number {
  const { clientHeight, scrollHeight, scrollTop } = el;
  if (scrollHeight <= clientHeight) return 0;
  const maxScroll = scrollHeight - clientHeight;
  return Math.min(100, Math.round((scrollTop / maxScroll) * 100));
}

function sendGaScrollEvent(percentScrolled: number): void {
  if (!env.gaMeasurementId) return;
  try {
    sendGAEvent('event', 'scroll', { percent_scrolled: percentScrolled });
  } catch {
    // GA 전송 실패는 앱 흐름을 막지 않는다
  }
}

export interface CustomScrollbarProps {
  className?: string;
  children?: ReactNode;
}

export function CustomScrollbar({
  className = '',
  children,
}: CustomScrollbarProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const scrollDepthSentRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    scrollDepthSentRef.current = false;
  }, [pathname]);

  // 컴포넌트 언마운트 시 user-select 초기화 보장
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
    };
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { clientHeight, scrollHeight, scrollTop } = el;
    if (scrollHeight <= clientHeight) {
      setThumbHeight(0);
      setThumbOffset(0);
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const trackHeight = Math.max(
      clientHeight - SCROLLBAR_TRACK_INSET_PX * 2,
      0,
    );
    const nextThumbHeight = Math.min(
      trackHeight,
      trackHeight * ratio * SCROLLBAR_THUMB_HEIGHT_SCALE,
    );
    const maxThumbOffset = Math.max(trackHeight - nextThumbHeight, 0);
    const scrollProgress = Math.min(
      Math.max(scrollTop / (scrollHeight - clientHeight), 0),
      1,
    );
    const nextThumbOffset = scrollProgress * maxThumbOffset;

    setThumbHeight(nextThumbHeight);
    setThumbOffset(nextThumbOffset);
  }, []);

  const showScrollbarTemporarily = useCallback(() => {
    setIsVisible(true);
    // 드래그 중에는 hide 타이머를 걸지 않는다
    if (isDraggingRef.current) return;
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = null;
    }, SCROLLBAR_VISIBLE_DURATION_MS);
  }, [clearHideTimer]);

  const reportScrollDepthOnUserScroll = useCallback(() => {
    if (scrollDepthSentRef.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const depth = getScrollDepthPercent(el);
    if (depth < GA_SCROLL_DEPTH_THRESHOLD) return;

    scrollDepthSentRef.current = true;
    sendGaScrollEvent(GA_SCROLL_DEPTH_THRESHOLD);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frameId: number | null = null;

    const handleScroll = () => {
      // 드래그 중에는 applyDragMove가 thumb 위치를 직접 갱신한다
      if (!isDraggingRef.current) {
        updateThumb();
      }
      showScrollbarTemporarily();
      reportScrollDepthOnUserScroll();
    };

    const handleResize = () => {
      updateThumb();
    };

    frameId = window.requestAnimationFrame(updateThumb);
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearHideTimer();
    };
  }, [
    clearHideTimer,
    reportScrollDepthOnUserScroll,
    showScrollbarTemporarily,
    updateThumb,
  ]);

  // 드래그 시작: 현재 thumb 크기로부터 maxThumbOffset 계산
  const startDrag = useCallback(
    (clientY: number) => {
      const el = scrollRef.current;
      if (!el) return;

      const { clientHeight, scrollHeight } = el;
      const trackH = Math.max(clientHeight - SCROLLBAR_TRACK_INSET_PX * 2, 0);
      const tHeight = Math.min(
        trackH,
        (clientHeight / scrollHeight) * trackH * SCROLLBAR_THUMB_HEIGHT_SCALE,
      );

      dragStateRef.current = {
        clientY,
        scrollTop: el.scrollTop,
        maxScrollTop: scrollHeight - clientHeight,
        maxThumbOffset: Math.max(trackH - tHeight, 0),
      };
      isDraggingRef.current = true;
      setIsDragging(true);
      clearHideTimer();
      document.body.style.userSelect = 'none';
    },
    [clearHideTimer],
  );

  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(e.clientY);
    },
    [startDrag],
  );

  // 드래그 중 document 레벨 이벤트 처리
  useEffect(() => {
    if (!isDragging) return;

    const applyDragMove = (clientY: number) => {
      const drag = dragStateRef.current;
      const el = scrollRef.current;
      if (!drag || !el) return;

      const deltaY = clientY - drag.clientY;
      const scrollDelta =
        drag.maxThumbOffset > 0
          ? (deltaY / drag.maxThumbOffset) * drag.maxScrollTop
          : 0;
      const nextScrollTop = Math.max(
        0,
        Math.min(drag.maxScrollTop, drag.scrollTop + scrollDelta),
      );
      el.scrollTop = nextScrollTop;

      // scroll 이벤트 → setState 경유 없이 thumb를 즉시 동기화한다
      const nextThumbOffset =
        drag.maxScrollTop > 0
          ? (nextScrollTop / drag.maxScrollTop) * drag.maxThumbOffset
          : 0;
      setThumbOffset(nextThumbOffset);
    };

    const endDrag = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      updateThumb();
      showScrollbarTemporarily();
    };

    const onMouseMove = (e: MouseEvent) => applyDragMove(e.clientY);
    const onMouseUp = () => endDrag();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, showScrollbarTemporarily, updateThumb]);

  return (
    <div className="relative min-h-0 w-full flex-1">
      <div
        ref={scrollRef}
        className={cn(
          'hide-native-scrollbar h-full overflow-y-auto',
          className,
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-2 right-1 z-50 w-2 transition-opacity duration-300',
          (isVisible || isDragging) && thumbHeight > 0
            ? 'opacity-100'
            : 'opacity-0',
        )}
      >
        <div
          className={cn(
            'absolute w-full rounded-lg bg-scrollbar-thumb',
            (isVisible || isDragging) && thumbHeight > 0
              ? 'pointer-events-auto'
              : 'pointer-events-none',
            isDragging
              ? 'cursor-grabbing opacity-90'
              : 'cursor-grab opacity-60 transition-[opacity,transform] duration-150 hover:opacity-90',
          )}
          style={{
            height: `${thumbHeight}px`,
            transform: `translateY(${thumbOffset}px)`,
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </div>
  );
}
