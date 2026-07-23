import type { Metadata } from 'next';

import { TermsClientPage } from './TermsClientPage';

export const metadata: Metadata = {
  title: '이용약관',
  description: 'Mealio 서비스 이용약관입니다.',
};

export default function TermsPage() {
  return <TermsClientPage />;
}
