import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  UserProfile,
  type UserProfileProps,
} from '@/components/mypage/UserProfile';
import { CreditUsageCard } from '@/components/mypage/CreditUsageCard';

export interface MypageHeaderProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  loggedIn?: boolean;
  userProfileProps?: Omit<UserProfileProps, 'loggedIn'>;
}

export function MypageHeader({
  className = '',
  loggedIn = true,
  userProfileProps,
  ...rest
}: MypageHeaderProps) {
  return (
    <header
      className={cn(
        'flex w-full flex-col items-start gap-6 bg-background-surface px-4 py-6 shadow-(--semantic-shadow-sm)',
        className,
      )}
      data-name="MypageHeader"
      {...rest}
    >
      <UserProfile
        loggedIn={loggedIn}
        {...userProfileProps}
        message={userProfileProps?.message ?? '로그인이 필요합니다'}
      />
      <CreditUsageCard used={250} max={1000} label="크레딧 사용량" />
    </header>
  );
}
