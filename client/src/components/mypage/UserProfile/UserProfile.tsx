import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  ProfileIconShell,
  type ProfileIconShellProvider,
} from '@/components/ui/ProfileIconShell';

export interface UserProfileProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  loggedIn?: boolean;
  provider?: ProfileIconShellProvider;
  nickname?: string;
  email?: string;
  message?: string;
}

export function UserProfile({
  className = '',
  loggedIn = true,
  provider = 'none',
  nickname = 'Nickname',
  email = 'recipe@example.com',
  message = '로그인이 필요해요',
  ...rest
}: UserProfileProps) {
  return (
    <section
      className={cn('flex w-full items-center gap-4', className)}
      data-name="UserProfile"
      {...rest}
    >
      <ProfileIconShell
        aria-hidden
        provider={loggedIn ? provider : 'none'}
      />
      <div className="min-w-0 flex-1">
        {loggedIn ? (
          <>
            <h2 className="truncate typo-h2 style-text-primary">{nickname}</h2>
            <p className="truncate typo-caption-regular style-text-secondary">
              {email}
            </p>
          </>
        ) : (
          <h2 className="truncate typo-h2 style-text-primary">{message}</h2>
        )}
      </div>
    </section>
  );
}
