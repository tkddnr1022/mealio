import type { Metadata } from 'next';

import { ActivityClientPage } from './ActivityClientPage';

export const metadata: Metadata = {
  title: '활동 내역',
  description: '최근 레시피 탐색 및 계정 활동 기록을 확인합니다.',
  robots: { index: false, follow: false },
};

export default function ActivityPage() {
  return <ActivityClientPage />;
}
