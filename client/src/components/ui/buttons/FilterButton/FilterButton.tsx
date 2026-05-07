import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';

/** Figma FilterButton — 필터 페이지 이동/열기 (touch-target-icon, 아이콘 lg). */
export interface FilterButtonProps {
  className?: string;
  onClick?: () => void;
}

export function FilterButton({ className = '', onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      className={cn('touch-target-icon', className)}
      aria-label={buildAriaLabel('button', '필터')}
      onClick={onClick}
    >
      <SlidersHorizontal className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
