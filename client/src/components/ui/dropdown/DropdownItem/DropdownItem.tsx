import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DropdownItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  className?: string;
  label?: string;
  selected?: boolean;
}

export function DropdownItem({
  className = '',
  label,
  selected = false,
  type = 'button',
  children,
  ...rest
}: DropdownItemProps) {
  return (
    <button
      type={type}
      className={cn(
        'typo-label-dropdown inline-flex w-full items-start px-4 py-3 text-left outline-none transition-colors',
        selected
          ? 'bg-dropdown-selected-default style-text-accent hover:bg-dropdown-selected-hover'
          : 'bg-dropdown-unselected-default style-text-primary hover:bg-dropdown-unselected-hover',
        className,
      )}
      {...rest}
    >
      {children ?? label}
    </button>
  );
}
