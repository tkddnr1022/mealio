import type { Metadata } from 'next';

import { OAuthCallbackClientPage } from './OAuthCallbackClientPage';

export const metadata: Metadata = {
  title: '로그인 처리 중',
  description: '소셜 로그인을 완료하고 있습니다.',
  robots: { index: false, follow: false },
};

export default function OAuthCallbackPage() {
  return <OAuthCallbackClientPage />;
}
