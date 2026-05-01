import type { HTMLAttributes } from 'react';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/types/auth';
import { cn } from '@/lib/utils/cn';
import { LoginButton } from '@/components/auth/LoginButton';

export type LoginButtonListProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    className?: string;
    providers?: readonly OAuthProvider[];
  }
>;

export function LoginButtonList({
  className = '',
  providers = OAUTH_PROVIDERS,
  ...rest
}: LoginButtonListProps) {
  return (
    <section
      className={cn('flex w-full flex-col items-start gap-3 px-4', className)}
      data-name="LoginButtonList"
      {...rest}
    >
      {providers.map((provider) => (
        <LoginButton key={provider} provider={provider} />
      ))}
    </section>
  );
}
