import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  className?: string;
  selected?: boolean;
}

/** IconShell `size="small"` — copied as-is */
const shellSizeClassName = 'p-1';
const iconSizeClassName = 'size-4';

/** IconShell `variant="primary"` — copied as-is */
const selectedToneClassName =
  'bg-toggle-selected-default style-text-toggle-active';

/** IconShell `variant="secondary"` — copied as-is */
const unselectedToneClassName =
  'bg-toggle-unselected-default style-text-toggle-inactive';

export function Checkbox({
  className = '',
  selected = false,
  type = 'button',
  ...rest
}: CheckboxProps) {
  return (
    <button
      type={type}
      role="checkbox"
      aria-checked={selected}
      className={cn(
        'inline-flex items-center justify-center rounded-full [&_svg]:shrink-0 [&_svg]:stroke-current',
        shellSizeClassName,
        selected ? selectedToneClassName : unselectedToneClassName,
        className,
      )}
      data-name="Checkbox"
      data-selected={selected ? 'true' : 'false'}
      {...rest}
    >
      <Check className={iconSizeClassName} strokeWidth={2} aria-hidden />
    </button>
  );
}
