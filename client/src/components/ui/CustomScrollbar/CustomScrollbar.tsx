"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const SCROLLBAR_THUMB_HEIGHT_SCALE = 1;
const SCROLLBAR_VISIBLE_DURATION_MS = 500;
const SCROLLBAR_TRACK_INSET_PX = 8;

export type CustomScrollbarProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

export function CustomScrollbar({
  className = "",
  children,
}: CustomScrollbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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
    const trackHeight = Math.max(clientHeight - SCROLLBAR_TRACK_INSET_PX * 2, 0);
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frameId: number | null = null;

    const handleScroll = () => {
      updateThumb();
      showScrollbarTemporarily();
    };

    const handleResize = () => {
      updateThumb();
    };

    frameId = window.requestAnimationFrame(updateThumb);
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearHideTimer();
    };
  }, [clearHideTimer, showScrollbarTemporarily, updateThumb]);

  return (
    <div className="relative min-h-0 w-full flex-1">
      <div
        ref={scrollRef}
        className={cn("hide-native-scrollbar h-full overflow-y-auto", className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-2 right-1 z-50 w-2 transition-opacity duration-300",
          isVisible && thumbHeight > 0 ? "opacity-100" : "opacity-0",
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
