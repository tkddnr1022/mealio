import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { IconShell } from '@/components/ui/IconShell';

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
  buttonHref = '/',
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
        <Button
          href={buttonHref}
          variant="primary"
          size="large"
          label={buttonLabel}
          className="w-auto self-center"
        />
      ) : null}
    </section>
  );
}
