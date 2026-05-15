import type { Metadata } from 'next';

import { ChatbotConversationListClientPage } from './ChatbotConversationListClientPage';

export const metadata: Metadata = {
  title: '챗봇',
  description:
    'AI 레시피 챗봇과의 대화 목록입니다. 새 대화를 시작해 맞춤 추천을 받아 보세요.',
  robots: { index: false, follow: false },
};

export default function ChatbotConversationListPage() {
  return <ChatbotConversationListClientPage />;
}
