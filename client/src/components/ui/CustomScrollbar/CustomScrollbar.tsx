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
const SCROLLBAR_VISIBLE_DURATION_MS = 500;
const SCROLLBAR_TRACK_INSET_PX = 8;
/** GA4 Enhanced Measurement scroll 이벤트와 동일한 임계치(%) */
const GA_SCROLL_DEPTH_THRESHOLD = 90;

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
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    scrollDepthSentRef.current = false;
  }, [pathname]);

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
      updateThumb();
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
          isVisible && thumbHeight > 0 ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div
          className="w-full rounded-lg bg-scrollbar-thumb transition-transform duration-50"
          style={{
            height: `${thumbHeight}px`,
            transform: `translateY(${thumbOffset}px)`,
          }}
        />
      </div>
    </div>
  );
}
