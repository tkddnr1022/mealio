'use client';

import { CheckCircle2, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';
import type { ToastItem, ToastVariant } from '@/lib/toast/toast.types';

/** `Alert`와 동일한 variant 토큰 + 성공용 확장 */
const rootClassMap: Record<ToastVariant, string> = {
  error: 'border border-alert-error-border bg-alert-error-subtle',
  warning: 'border border-alert-warning-border bg-alert-warning-subtle',
  info: 'border border-alert-info-border bg-alert-info-subtle',
  success:
    'border border-[color-mix(in_srgb,var(--color-ext-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-ext-success)_12%,var(--color-background-surface))]',
};

const titleClassMap: Record<ToastVariant, string> = {
  error: 'text-alert-error-strong',
  warning: 'text-alert-warning-strong',
  info: 'text-alert-info-strong',
  success: 'text-[var(--color-ext-success)]',
};

const iconShellClassMap: Record<ToastVariant, string> = {
  error: 'bg-alert-error-icon-fill text-on-primary',
  warning: 'bg-background-surface text-alert-warning-strong',
  info: 'bg-background-surface text-alert-info-strong',
  success: 'bg-background-surface text-[var(--color-ext-success)]',
};

const variantIcon: Record<ToastVariant, LucideIcon> = {
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
  success: CheckCircle2,
};

export interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export function ToastCard({
  item,
  onDismiss,
}: ToastCardProps): React.JSX.Element {
  const headingId = useId();
  const Icon = variantIcon[item.variant];
  const isAssertive = item.variant === 'error';

  useEffect(() => {
    if (item.durationMs <= 0) return undefined;
    const t = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(t);
  }, [item.durationMs, item.id, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-lg p-3 shadow-lg transition-opacity duration-200',
        rootClassMap[item.variant],
      )}
      data-name="ToastCard"
      data-variant={item.variant}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-labelledby={headingId}
    >
      <div
        className={cn(
          'mt-0.5 flex shrink-0 items-center justify-center rounded-full p-1.5',
          iconShellClassMap[item.variant],
        )}
        aria-hidden
      >
        <Icon className="size-4 shrink-0" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5 text-left">
        <p
          id={headingId}
          className={cn('typo-caption-medium', titleClassMap[item.variant])}
        >
          {item.title}
        </p>
        {item.message?.trim() ? (
          <p className="typo-small style-text-secondary">{item.message}</p>
        ) : null}
        {item.action ? (
          <div className="pt-1">
            <Button
              type="button"
              variant="secondary"
              size="medium"
              className="h-auto min-h-0 w-auto self-start px-3 py-1.5 typo-small"
              onClick={() => {
                item.action?.onAction();
                onDismiss(item.id);
              }}
            >
              {item.action.label}
            </Button>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1 style-text-secondary hover:style-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={buildAriaLabel('button', '알림 닫기')}
        onClick={() => onDismiss(item.id)}
      >
        <X className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
