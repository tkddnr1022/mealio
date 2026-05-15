import type { Metadata } from 'next';

import { MypageClientPage } from './MypageClientPage';

export const metadata: Metadata = {
  title: '마이페이지',
  description: '프로필·닉네임 등 내 계정 정보를 확인합니다.',
  robots: { index: false, follow: false },
};

export default function MypagePage() {
  return <MypageClientPage />;
}
