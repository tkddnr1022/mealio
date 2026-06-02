'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { ActionGroup } from '@/components/ui/ActionGroup';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/auth-context';
import { useUpdateNickname } from '@/lib/queries/user.queries';

export function ProfileClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const updateNicknameMutation = useUpdateNickname({
    meta: { currentUrl: pathname },
  });
  const trimmedNickname = nickname.trim();
  const currentNickname =
    updateNicknameMutation.data?.nickname ?? user?.nickname ?? '';
  const isSaveDisabled =
    updateNicknameMutation.isPending ||
    trimmedNickname.length < 2 ||
    trimmedNickname === currentNickname.trim();

  return (
    <>
      <Navbar
        displayTitle={false}
        displayBackButton
        onBack={() => router.back()}
      />
      <MainContent>
        <section className="w-full rounded-2xl bg-background-surface p-4 shadow-(--semantic-shadow-sm)">
          <label
            htmlFor="email-input"
            className="typo-body-small style-text-secondary"
          >
            이메일
          </label>
          <Input
            id="email-input"
            className="typo-body-regular"
            wrapperClassName="mt-2"
            value={user?.email ?? ''}
            disabled
            readOnly
          />
        </section>

        <section className="w-full rounded-2xl bg-background-surface p-4 shadow-(--semantic-shadow-sm)">
          <label
            htmlFor="nickname-input"
            className="typo-body-small style-text-secondary"
          >
            닉네임
          </label>
          <Input
            id="nickname-input"
            className="typo-body-regular"
            wrapperClassName="mt-2"
            value={nickname}
            maxLength={20}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="닉네임을 입력해 주세요"
          />
        </section>
      </MainContent>
      <ActionGroup
        rightButtonProps={{
          label: updateNicknameMutation.isPending ? '저장 중…' : '저장',
          disabled: isSaveDisabled,
          onClick: () =>
            updateNicknameMutation.mutate({ nickname: trimmedNickname }),
        }}
      />
    </>
  );
}
