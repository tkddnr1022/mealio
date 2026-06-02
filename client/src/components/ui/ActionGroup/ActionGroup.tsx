import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

import { Button, type ButtonAsButtonProps } from '@/components/ui/Button';

export interface ActionGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'className'
> {
  className?: string;
  leftButtonProps?: Omit<ButtonAsButtonProps, 'className' | 'size'>;
  rightButtonProps?: Omit<ButtonAsButtonProps, 'className' | 'size'>;
}

export function ActionGroup({
  className = '',
  leftButtonProps,
  rightButtonProps,
  ...rest
}: ActionGroupProps) {
  if (!leftButtonProps && !rightButtonProps) {
    return null;
  }

  return (
    <section
      className={cn(
        'flex w-full items-start gap-4 border-t border-border-subtle bg-background-surface px-4 py-3',
        className,
      )}
      data-name="ActionGroup"
      {...rest}
    >
      {leftButtonProps && (
        <Button
          size="large"
          variant="secondary"
          className="flex-1"
          {...leftButtonProps}
        />
      )}
      {rightButtonProps && (
        <Button
          size="large"
          variant="primary"
          className="flex-1"
          {...rightButtonProps}
        />
      )}
    </section>
  );
}
