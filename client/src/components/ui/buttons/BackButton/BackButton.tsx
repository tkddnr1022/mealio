import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';

/** Figma BackButton — Navbar·상세 헤더 등 공통 뒤로가기 (touch-target-icon, 아이콘 lg). */
export interface BackButtonProps {
  className?: string;
  onClick?: () => void;
}

export function BackButton({ className = '', onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      className={cn('touch-target-icon', className)}
      aria-label={buildAriaLabel('button', '뒤로 가기')}
      onClick={onClick}
    >
      <ArrowLeft className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
