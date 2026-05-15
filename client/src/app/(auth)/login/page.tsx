import type { Metadata } from 'next';

import { LoginClientPage } from './LoginClientPage';

export const metadata: Metadata = {
  title: '로그인',
  description:
    '소셜 계정으로 로그인하고 Mealio 맞춤 레시피 추천·보관함·챗봇을 이용하세요.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClientPage />;
}
