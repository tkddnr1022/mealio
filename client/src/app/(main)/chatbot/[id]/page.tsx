import type { Metadata } from 'next';

import { ChatbotConversationClientPage } from './ChatbotConversationClientPage';

export const metadata: Metadata = {
  title: '대화',
  description: '레시피 추천 챗봇과의 대화입니다.',
  robots: { index: false, follow: false },
};

export default function ChatbotConversationPage() {
  return <ChatbotConversationClientPage />;
}
