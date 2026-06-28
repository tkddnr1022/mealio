import type { HTMLAttributes, ReactNode } from 'react';
import { HOME_PATH } from '@/lib/constants/routes.constants';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { cn } from '@/lib/utils/cn';
import { IconShell } from '@/components/ui/IconShell';
import { NavLink } from '@/components/ui/NavLink';

export interface InfoScreenProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  message?: string;
  icon?: ReactNode;
  showButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
}

function slugifyHeadingId(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/gi, '');
  return base.length > 0 ? base : 'info-screen-heading';
}

export function InfoScreen({
  className = '',
  title,
  message,
  icon,
  showButton = true,
  buttonLabel,
  buttonHref = HOME_PATH,
  ...rest
}: InfoScreenProps) {
  const headingId =
    title !== undefined && title.trim().length > 0
      ? `info-screen-${slugifyHeadingId(title)}`
      : undefined;

  return (
    <section
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 p-4 text-center',
        className,
      )}
      role="region"
      aria-labelledby={headingId}
      data-name="InfoScreen"
      {...rest}
    >
      <IconShell variant="muted" size="xlarge" icon={icon} />
      {title !== undefined && title.trim().length > 0 ? (
        <h3 id={headingId} className="typo-h3 style-text-primary">
          {title}
        </h3>
      ) : null}
      <p className="typo-body-regular style-text-secondary">{message}</p>
      {showButton ? (
        <NavLink
          href={buttonHref}
          className={cn(
            'inline-flex w-auto items-center justify-center self-center rounded-full px-4 py-3 no-underline outline-none transition-colors typo-label-button',
            'bg-primary-default style-text-button-primary hover:bg-primary-hover',
            'focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default',
          )}
          aria-label={buildAriaLabel('link', buttonLabel?.trim() ?? '')}
          replace
        >
          {buttonLabel}
        </NavLink>
      ) : null}
    </section>
  );
}
