'use client';

import {
  Activity,
  CircleHelp,
  FileText,
  LogIn,
  LogOut,
  Shield,
  SquarePen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { MenuSection, MypageHeader } from '@/components/mypage';
import { AuthStatus, useAuth } from '@/lib/auth/auth-context';
import { buildLoginUrl } from '@/lib/auth/routes';
import { useLogoutMutation } from '@/lib/queries/auth.queries';

export function MypageClientPage() {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const { status, user } = useAuth();
  const loginHref = buildLoginUrl('/mypage');

  const loggedIn = status === AuthStatus.Authenticated && user != null;
  const nickname = user?.nickname;
  const email = user?.email;
  const creditMax = user?.creditMonthlyLimit ?? 0;
  const creditBalance = user?.creditBalance ?? 0;
  const creditUsed =
    creditMax > 0
      ? Math.max(0, Math.min(creditMax, creditMax - creditBalance))
      : 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background-primary">
      <Navbar />
      <MainContent paddingX={false} paddingY={false} innerClassName="gap-4">
        <MypageHeader
          loggedIn={loggedIn}
          creditUsed={creditUsed}
          creditMax={creditMax}
          userProfileProps={
            loggedIn ? { nickname, email } : { message: '로그인이 필요해요' }
          }
        />

        {loggedIn ? (
          <>
            <MenuSection
              items={[
                {
                  href: '/mypage/profile',
                  label: '프로필 수정',
                  leadingIcon: (
                    <SquarePen className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
                {
                  href: '/mypage/activity',
                  label: '활동 내역',
                  leadingIcon: (
                    <Activity className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
              ]}
            />
            <MenuSection
              items={[
                {
                  href: '#help',
                  label: '도움말',
                  leadingIcon: (
                    <CircleHelp
                      className="size-5"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
              ]}
            />
            <MenuSection
              items={[
                {
                  href: '/terms',
                  label: '이용약관',
                  leadingIcon: (
                    <FileText className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
                {
                  href: '/privacy',
                  label: '개인정보 처리방침',
                  leadingIcon: (
                    <Shield className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
              ]}
            />
            <MenuSection
              items={[
                {
                  label: '로그아웃',
                  labelClassName: 'style-text-accent',
                  leadingIcon: (
                    <LogOut className="size-5" strokeWidth={2} aria-hidden />
                  ),
                  disabled: logoutMutation.isPending,
                  className: logoutMutation.isPending
                    ? 'pointer-events-none opacity-60'
                    : undefined,
                  onClick: () => {
                    logoutMutation.mutate(undefined, {
                      onSuccess: () => {
                        router.push('/login');
                      },
                    });
                  },
                },
              ]}
            />
          </>
        ) : (
          <>
            <MenuSection
              items={[
                {
                  href: loginHref,
                  label: '로그인',
                  leadingIcon: (
                    <LogIn className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
              ]}
            />
            <MenuSection
              items={[
                {
                  href: '/terms',
                  label: '이용약관',
                  leadingIcon: (
                    <FileText className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
                {
                  href: '/privacy',
                  label: '개인정보 처리방침',
                  leadingIcon: (
                    <Shield className="size-5" strokeWidth={2} aria-hidden />
                  ),
                },
              ]}
            />
          </>
        )}
      </MainContent>
      <Tabbar activeId="mypage" />
    </div>
  );
}
