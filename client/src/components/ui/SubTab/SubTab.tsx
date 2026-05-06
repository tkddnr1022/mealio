import Link from 'next/link';
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MouseEventHandler,
} from 'react';
import { cn } from '@/lib/utils/cn';
import { isInternalNavHref } from '@/lib/utils/isInternalNavHref';

export interface SubTabProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> {
  className?: string;
  label?: string;
  selected?: boolean;
  /** 설정 시 앱 내 경로는 `Link`, 그 외는 `<a>`로 렌더 */
  href?: string;
  /**
   * true면 클릭 시 라우팅을 막고 `onClick`만 실행 (Storybook 등)
   */
  preventLinkNavigation?: boolean;
}

export function SubTab({
  className = '',
  label,
  selected = false,
  type = 'button',
  href,
  preventLinkNavigation = false,
  onClick,
  ...rest
}: SubTabProps) {
  const sharedClass = cn(
    'inline-flex min-h-11 min-w-px flex-1 items-center justify-center border-b bg-background-surface px-3 py-3 text-center outline-none transition-colors',
    selected
      ? 'border-border-accent border-b-2 typo-label-dropdown style-text-tab-active'
      : 'border-border-subtle border-b typo-label-dropdown style-text-tab-inactive',
    className,
  );

  const content = label;

  if (href != null && href !== '') {
    const anchorClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
      if (preventLinkNavigation) e.preventDefault();
      onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
    };

    if (isInternalNavHref(href)) {
      return (
        <Link
          href={href}
          className={sharedClass}
          aria-current={selected ? 'page' : undefined}
          onClick={anchorClick}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={sharedClass}
        aria-current={selected ? 'page' : undefined}
        onClick={anchorClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={sharedClass}
      aria-pressed={selected}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
}
