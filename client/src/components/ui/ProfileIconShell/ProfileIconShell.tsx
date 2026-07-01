import { User } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import {
  getProfileIconShellAriaLabel,
  OAUTH_PROVIDER_META,
  type ProfileIconShellProvider,
} from '@/lib/auth/providers';
import { cn } from '@/lib/utils/cn';
import { AdaptiveImage } from '@/components/ui/AdaptiveImage';
import { IconShell } from '@/components/ui/IconShell';

export interface ProfileIconShellProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  provider?: ProfileIconShellProvider;
}

export function ProfileIconShell({
  className = '',
  provider = 'none',
  ...rest
}: ProfileIconShellProps) {
  const ariaLabel = getProfileIconShellAriaLabel(provider);

  if (provider === 'none') {
    return (
      <IconShell
        variant="accent"
        size="xlarge"
        className={className}
        icon={<User className="size-8" strokeWidth={2} aria-hidden />}
        aria-label={ariaLabel}
        data-name="ProfileIconShell"
        data-provider={provider}
        {...rest}
      />
    );
  }

  const { className: providerClassName, iconSrc } =
    OAUTH_PROVIDER_META[provider];

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full p-4 [&_svg]:shrink-0',
        providerClassName,
        className,
      )}
      role="img"
      aria-label={ariaLabel}
      data-name="ProfileIconShell"
      data-provider={provider}
      {...rest}
    >
      <AdaptiveImage
        src={iconSrc}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
    </div>
  );
}
