import type { Metadata } from 'next';

import { OAuthErrorClientPage } from './OAuthErrorClientPage';

export const metadata: Metadata = {
  title: '로그인 오류',
  description:
    '소셜 로그인 과정에서 오류가 발생했습니다. 안내에 따라 로그인을 다시 시도해 주세요.',
  robots: { index: false, follow: false },
};

export default function OAuthErrorPage() {
  return <OAuthErrorClientPage />;
}
