'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { InfoScreen } from '@/components/layout/InfoScreen';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { ActivityList } from '@/components/mypage/ActivityList';
import { ListLoadMore } from '@/components/ui/ListLoadMore';
import { FooterText } from '@/components/ui/FooterText';
import { USER_ACTIVITY_LIST_LIMIT } from '@/lib/policy/pagination.policy';
import { useMyActivitiesInfinite } from '@/lib/queries/user.queries';

export function ActivityClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMyActivitiesInfinite(
    { limit: USER_ACTIVITY_LIST_LIMIT },
    { meta: { currentUrl: pathname } },
  );

  const items = useMemo(
    () => listData?.pages.flatMap((page) => page.items) ?? [],
    [listData?.pages],
  );

  return (
    <>
      <Navbar
        displayTitle={false}
        displayBackButton
        onBack={() => router.back()}
      />
      <MainContent>
        {items.length === 0 && !isLoading ? (
          <InfoScreen
            title="아직 활동 내역이 없어요"
            message="레시피를 조회하거나 챗봇을 사용하면 기록이 쌓여요."
            showButton={false}
          />
        ) : (
          <>
            <ActivityList items={items} />
            <ListLoadMore
              hasMore={hasNextPage ?? false}
              isLoading={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
            />
            <FooterText>최근 90일간의 활동 내역만 보관돼요</FooterText>
          </>
        )}
      </MainContent>
      <Tabbar activeId="mypage" />
    </>
  );
}
