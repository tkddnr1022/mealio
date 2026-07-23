import type { Metadata } from 'next';

import { HelpClientPage } from './HelpClientPage';

export const metadata: Metadata = {
  title: '도움말',
  description: 'Mealio 데모 이용 안내와 자주 묻는 질문입니다.',
};

export default function HelpPage() {
  return <HelpClientPage />;
}
