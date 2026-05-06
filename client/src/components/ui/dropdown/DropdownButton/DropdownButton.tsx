import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DropdownButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  className?: string;
  label?: string;
  open?: boolean;
}

export function DropdownButton({
  className = '',
  label,
  open = false,
  type = 'button',
  children,
  ...rest
}: DropdownButtonProps) {
  return (
    <button
      type={type}
      aria-expanded={open}
      className={cn(
        'typo-label-dropdown inline-flex items-center gap-2 rounded-lg bg-background-primary px-3 py-2 style-text-primary outline-none transition-colors hover:bg-background-placeholder focus-visible:ring-(length:--border-width-focus) focus-visible:ring-primary-default focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary',
        className,
      )}
      {...rest}
    >
      <span>{children ?? label}</span>
      {open ? (
        <ChevronUp
          className="size-5 style-text-secondary"
          strokeWidth={2}
          aria-hidden
        />
      ) : (
        <ChevronDown
          className="size-5 style-text-secondary"
          strokeWidth={2}
          aria-hidden
        />
      )}
    </button>
  );
}
