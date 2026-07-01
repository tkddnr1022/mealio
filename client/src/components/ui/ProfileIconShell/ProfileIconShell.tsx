import { User } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { type OAuthProvider } from '@/lib/types/auth';
import { cn } from '@/lib/utils/cn';
import { AdaptiveImage } from '@/components/ui/AdaptiveImage';
import { IconShell } from '@/components/ui/IconShell';

export type ProfileIconShellProvider = 'none' | OAuthProvider;

export interface ProfileIconShellProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  provider?: ProfileIconShellProvider;
}

const OAUTH_PROVIDER_META: Record<
  OAuthProvider,
  Readonly<{
    className: string;
    iconSrc: string;
  }>
> = {
  kakao: {
    className: 'bg-provider-kakao-primary text-provider-kakao-on-primary',
    iconSrc: '/oauth/kakao.svg',
  },
  naver: {
    className: 'bg-provider-naver-primary text-provider-naver-on-primary',
    iconSrc: '/oauth/naver.svg',
  },
  google: {
    className: 'bg-provider-google-primary text-provider-google-on-primary',
    iconSrc: '/oauth/google.svg',
  },
};

export function ProfileIconShell({
  className = '',
  provider = 'none',
  ...rest
}: ProfileIconShellProps) {
  if (provider === 'none') {
    return (
      <IconShell
        variant="accent"
        size="xlarge"
        className={className}
        icon={<User className="size-8" strokeWidth={2} aria-hidden />}
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
