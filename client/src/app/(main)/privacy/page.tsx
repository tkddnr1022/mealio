import type { Metadata } from 'next';

import { PrivacyClientPage } from './PrivacyClientPage';

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: 'Mealio 개인정보 처리방침입니다.',
};

export default function PrivacyPage() {
  return <PrivacyClientPage />;
}
