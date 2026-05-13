import { Coins } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { buildAriaLabel } from '@/lib/utils/a11y';

const numberFormatter = new Intl.NumberFormat('ko-KR');

export interface CreditUsageCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  /** 사용한 크레딧 수 */
  used?: number;
  /** 상한 크레딧 수 */
  max?: number;
  /** 헤더 왼쪽 라벨 (기본: 크레딧 사용량) */
  label?: string;
}

function clampPercent(used: number, max: number) {
  if (max <= 0 || !Number.isFinite(used) || !Number.isFinite(max)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((used / max) * 100)));
}

export function CreditUsageCard({
  className = '',
  used = 0,
  max = 1000,
  label = '크레딧 사용량',
  ...rest
}: CreditUsageCardProps) {
  const cap = Number.isFinite(max) && max > 0 ? max : 0;
  const safeUsed = Number.isFinite(used) ? Math.max(0, used) : 0;
  const percent = cap > 0 ? clampPercent(safeUsed, cap) : 0;
  const usedStr = numberFormatter.format(safeUsed);
  const maxStr = cap > 0 ? numberFormatter.format(cap) : numberFormatter.format(0);

  return (
    <section
      className={cn(
        'flex w-full flex-col gap-3 rounded-(--card-radius) bg-background-primary p-4',
        className,
      )}
      aria-label={buildAriaLabel('section', label)}
      data-name="CreditUsageCard"
      {...rest}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Coins
            className="size-6 shrink-0 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <p className="truncate typo-caption-regular style-text-placeholder">
            {label}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1 typo-body-bold whitespace-nowrap">
          <span className="style-text-primary">{usedStr}</span>
          <span className="style-text-disabled">/</span>
          <span className="style-text-disabled">{maxStr}</span>
        </div>
      </div>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-border-subtle"
        {...(cap > 0
          ? {
              role: 'progressbar' as const,
              'aria-valuemin': 0,
              'aria-valuemax': cap,
              'aria-valuenow': Math.min(safeUsed, cap),
              'aria-label': buildAriaLabel('generic', `${label} 진행`),
            }
          : { 'aria-hidden': true as const })}
      >
        <div
          className="style-fill-gradation-primary h-full rounded-full transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex w-full items-center justify-between">
        <p className="typo-small style-text-disabled">
          {percent}% 사용
        </p>
      </div>
    </section>
  );
}
