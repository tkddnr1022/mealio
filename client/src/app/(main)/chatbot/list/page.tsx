'use client';

import { MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import {
  chatbotQueries,
  useConversationList,
} from '@/lib/queries/chatbot.queries';
import { getConversationHistory } from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { ChatList } from '@/components/chatbot/list/ChatList';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { AddButton } from '@/components/ui/buttons/AddButton';

const CONVERSATION_LIST_LIMIT = 20;
const PREVIEW_TEXT_MAX = 54;
const TITLE_TEXT_MAX = 20;

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function createFallbackTitle(conversationId: string): string {
  return `대화 ${conversationId.slice(0, 8)}`;
}

export default function ChatbotConversationListPage() {
  const router = useRouter();
  const { data: listData } = useConversationList({
    limit: CONVERSATION_LIST_LIMIT,
  });
  const items = useMemo(() => listData?.items ?? [], [listData?.items]);

  const detailQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: chatbotQueries.conversationDetail(item.conversationId),
      queryFn: () => getConversationHistory(item.conversationId),
      ...QUERY_CACHE.chatbot,
    })),
  });

  const chats = useMemo(() => {
    return items.map((item, index) => {
      const messages = detailQueries[index]?.data?.messages ?? [];
      const lastMessage = messages[messages.length - 1];
      const firstUserMessage = messages.find(
        (message) => message.role === 'user',
      );
      const titleSource = firstUserMessage?.message?.trim();
      const previewSource = lastMessage?.message?.trim();

      return {
        conversationId: item.conversationId,
        updatedAt: item.updatedAt,
        title: truncate(
          titleSource && titleSource.length > 0
            ? titleSource
            : createFallbackTitle(item.conversationId),
          TITLE_TEXT_MAX,
        ),
        lastMessage: truncate(
          previewSource && previewSource.length > 0
            ? previewSource
            : '최근 대화 내용이 없습니다.',
          PREVIEW_TEXT_MAX,
        ),
      };
    });
  }, [detailQueries, items]);

  const hasChats = chats.length > 0;

  return (
    <>
      <Navbar
        additionalButtons={
          <AddButton onClick={() => router.push('/chatbot/new')} />
        }
      />

      <MainContent centered={!hasChats}>
        {hasChats ? (
          <ChatList
            chats={chats}
            getTitle={(chat) => chat.title}
            getLastMessage={(chat) => chat.lastMessage}
          />
        ) : (
          <InfoScreen
            icon={<MessageCircle className="size-8" aria-hidden />}
            title="대화 기록이 없습니다"
            message="첫 대화를 시작해 보세요"
            buttonLabel="대화 시작"
            buttonHref="/chatbot/list"
          />
        )}
      </MainContent>

      <Tabbar activeId="chatbot" />
    </>
  );
}
