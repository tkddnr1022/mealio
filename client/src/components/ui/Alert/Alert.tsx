import { CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';

export type AlertVariant = 'error' | 'warning' | 'info';

export interface AlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title'
> {
  className?: string;
  variant?: AlertVariant;
  title: string;
  message?: string;
}

const rootClassMap: Record<AlertVariant, string> = {
  error: 'border-t border-alert-error-border bg-alert-error-subtle',
  warning: 'border-t border-alert-warning-border bg-alert-warning-subtle',
  info: 'border-t border-alert-info-border bg-alert-info-subtle',
};

const titleClassMap: Record<AlertVariant, string> = {
  error: 'text-alert-error-strong',
  warning: 'text-alert-warning-strong',
  info: 'text-alert-info-strong',
};

const iconShellClassMap: Record<AlertVariant, string> = {
  error: 'bg-alert-error-icon-fill text-on-primary',
  warning: 'bg-background-surface text-alert-warning-strong',
  info: 'bg-background-surface text-alert-info-strong',
};

const variantIcon: Record<AlertVariant, LucideIcon> = {
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

export function Alert({
  className = '',
  variant = 'error',
  title,
  message,
  ...rest
}: AlertProps) {
  const label = message?.trim() ? `${title}. ${message}` : title;

  const Icon = variantIcon[variant];

  return (
    <div
      className={cn(
        'flex w-full items-center gap-4 border-solid p-4',
        rootClassMap[variant],
        className,
      )}
      data-name="Alert"
      data-variant={variant}
      role="region"
      aria-label={buildAriaLabel('section', label)}
      {...rest}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full p-2',
          iconShellClassMap[variant],
        )}
        aria-hidden
      >
        <Icon className="size-5 shrink-0" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={cn('typo-caption-medium', titleClassMap[variant])}>
          {title}
        </p>
        {message?.trim() ? (
          <p className="typo-small style-text-secondary">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
