import type { Metadata } from 'next';

import { ProfileClientPage } from './ProfileClientPage';

export const metadata: Metadata = {
  title: '프로필 수정',
  description: '닉네임 등 계정 정보를 수정합니다.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileClientPage />;
}
