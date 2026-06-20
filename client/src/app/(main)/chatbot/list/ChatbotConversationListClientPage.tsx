'use client';

import { MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useConversationListInfinite } from '@/lib/queries/chatbot.queries';
import { CHATBOT_CONVERSATION_LIST_LIMIT } from '@/lib/policy/pagination.policy';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { ChatList } from '@/components/chatbot/list/ChatList';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { AddButton } from '@/components/ui/buttons/AddButton';
import { FooterText } from '@/components/ui/FooterText';
import { ListLoadMore } from '@/components/ui/ListLoadMore';

const TITLE_TEXT_MAX = 20;

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function createFallbackTitle(conversationId: string): string {
  return `대화 ${conversationId.slice(0, 8)}`;
}

export function ChatbotConversationListClientPage() {
  const currentUrl = usePathname();
  const router = useRouter();
  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useConversationListInfinite(
    {
      limit: CHATBOT_CONVERSATION_LIST_LIMIT,
    },
    {
      meta: {
        currentUrl,
      },
    },
  );

  const items = useMemo(
    () => listData?.pages.flatMap((page) => page.items) ?? [],
    [listData?.pages],
  );

  const hasChats = items.length > 0;

  return (
    <>
      <Navbar
        additionalButtons={
          <AddButton onClick={() => router.push('/chatbot/new')} />
        }
      />

      <MainContent centered={!hasChats && !isLoading} scroll={hasChats} innerClassName="gap-6">
        {isLoading && !hasChats ? (
          <p className="typo-body-regular style-text-secondary">불러오는 중…</p>
        ) : hasChats ? (
          <>
            <ChatList
              chats={items}
              getTitle={(chat) =>
                truncate(
                  chat.title?.trim() ||
                    createFallbackTitle(chat.conversationId),
                  TITLE_TEXT_MAX,
                )
              }
            />
            <ListLoadMore
              hasMore={hasNextPage ?? false}
              isLoading={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
            />
            <FooterText>최근 30일간의 대화 내용만 보관돼요</FooterText>
          </>
        ) : (
          <InfoScreen
            icon={<MessageCircle className="size-8" aria-hidden />}
            title="대화 기록이 없어요"
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
