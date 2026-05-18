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
  /** 로그인 시 표시: 사용한 크레딧(월간 한도 − 잔액) */
  creditUsed?: number;
  /** 로그인 시 표시: 월간 크레딧 상한 */
  creditMax?: number;
}

export function MypageHeader({
  className = '',
  loggedIn = true,
  userProfileProps,
  creditUsed = 0,
  creditMax = 0,
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
        message={userProfileProps?.message ?? '로그인이 필요해요'}
      />
      {loggedIn && creditMax > 0 ? (
        <CreditUsageCard
          used={creditUsed}
          max={creditMax}
          label="크레딧 사용량"
        />
      ) : null}
    </header>
  );
}
