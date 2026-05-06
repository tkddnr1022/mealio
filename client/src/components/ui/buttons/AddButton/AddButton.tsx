import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';

/** Figma AddButton — Navbar 우측 추가 등 (touch-target-icon, 아이콘 lg). */
export interface AddButtonProps {
  className?: string;
  onClick?: () => void;
}

export function AddButton({ className = '', onClick }: AddButtonProps) {
  return (
    <button
      type="button"
      className={cn('touch-target-icon', className)}
      aria-label={buildAriaLabel('button', '추가')}
      onClick={onClick}
    >
      <Plus className="size-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
