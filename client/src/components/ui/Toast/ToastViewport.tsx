'use client';

import { ToastCard } from './ToastCard';
import type { ToastItem } from '@/lib/toast/toast.types';

export interface ToastViewportProps {
  items: readonly ToastItem[];
  onDismiss: (id: string) => void;
}

/**
 * 고정 뷰포트: 뷰포트 하단 중앙에 토스트 스택을 둔다(브레이크포인트 구분 없음).
 */
export function ToastViewport({
  items,
  onDismiss,
}: ToastViewportProps): React.JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4"
      aria-label="알림"
      data-name="ToastViewport"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
