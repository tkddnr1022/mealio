import type { HTMLAttributes } from 'react';
import { type OAuthProvider } from '@/lib/types/auth';
import { buildOAuthEntryUrl, getEnabledOAuthProviders } from '@/lib/auth/providers';
import { cn } from '@/lib/utils/cn';
import { LoginButton } from '@/components/auth/LoginButton';

export interface LoginButtonListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  className?: string;
  /** 비우면 `getEnabledOAuthProviders()`(환경 플래그 반영) */
  providers?: readonly OAuthProvider[];
  /**
   * 로그인 성공 후 돌아갈 상대 경로. 안전한 값(`/…`, `//` 아님)일 때만 백엔드 진입 URL에 `?next=`로 붙인다.
   */
  oauthNext?: string | null;
}

export function LoginButtonList({
  className = '',
  providers = getEnabledOAuthProviders(),
  oauthNext = null,
  ...rest
}: LoginButtonListProps) {
  return (
    <section
      className={cn('flex w-full flex-col items-start gap-3 px-4', className)}
      data-name="LoginButtonList"
      {...rest}
    >
      {providers.map((provider) => (
        <LoginButton
          key={provider}
          provider={provider}
          href={buildOAuthEntryUrl(provider, { next: oauthNext })}
        />
      ))}
    </section>
  );
}
