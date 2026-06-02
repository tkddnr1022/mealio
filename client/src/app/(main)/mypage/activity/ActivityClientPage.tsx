'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { InfoScreen } from '@/components/layout/InfoScreen';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { ActivityCard } from '@/components/mypage/ActivityCard';
import { ListLoadMore } from '@/components/ui/ListLoadMore';
import { useMyActivities } from '@/lib/queries/user.queries';
import type { UserActivityItem } from '@/lib/types/user';

const PAGE_SIZE = 20;

export function ActivityClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [cursor, setCursor] = useState<string | null>(null);
  const [items, setItems] = useState<UserActivityItem[]>([]);

  const activityQuery = useMyActivities(
    { limit: PAGE_SIZE, cursor: cursor ?? undefined },
    { meta: { currentUrl: pathname } },
  );

  const mergedItems = useMemo(() => {
    const latest = activityQuery.data?.items ?? [];
    if (cursor == null) {
      return latest;
    }
    return [...items, ...latest];
  }, [activityQuery.data?.items, cursor, items]);

  const hasMore = Boolean(activityQuery.data?.nextCursor);

  return (
    <>
      <Navbar
        displayTitle={false}
        displayBackButton
        onBack={() => router.back()}
      />
      <MainContent>
        {mergedItems.length === 0 && !activityQuery.isLoading ? (
          <InfoScreen
            title="아직 활동 내역이 없어요"
            message="레시피를 조회하거나 챗봇을 사용하면 기록이 쌓여요."
            showButton={false}
          />
        ) : (
          <section className="w-full space-y-3">
            {mergedItems.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
            <ListLoadMore
              hasMore={hasMore}
              isLoading={activityQuery.isFetching}
              onLoadMore={() => {
                setItems(mergedItems);
                setCursor(activityQuery.data?.nextCursor ?? null);
              }}
            />
          </section>
        )}
      </MainContent>
      <Tabbar activeId="mypage" />
    </>
  );
}
