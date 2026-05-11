'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import {
  InfoScreen,
  type InfoScreenProps,
} from '@/components/layout/InfoScreen';
import {
  InventorySubTabbar,
  type InventorySubTabbarItem,
} from '@/components/inventory';
import { AddButton } from '@/components/ui/buttons/AddButton';

export type InventoryViewTab =
  | 'ownedIngredients'
  | 'favoriteIngredients'
  | 'favoriteRecipes';

const INVENTORY_SUB_TABS: readonly InventorySubTabbarItem[] = [
  {
    id: 'ownedIngredients',
    label: '보유 재료',
    href: '/inventory/ingredients/owned',
  },
  {
    id: 'favoriteIngredients',
    label: '관심 재료',
    href: '/inventory/ingredients/favorite',
  },
  {
    id: 'favoriteRecipes',
    label: '관심 레시피',
    href: '/inventory/recipes/favorite',
  },
] as const;

export interface InventoryPageShellProps {
  tab: InventoryViewTab;
  /** 빈 상태일 때 InfoScreen을 표시 */
  isEmpty?: boolean;
  /** 빈 상태 시 InfoScreen에 전달할 props */
  infoScreenProps: InfoScreenProps;
  /** Navbar 우측 버튼 클릭 시 이동할 경로 */
  addHref: string;
  /** 데이터가 있을 때 표시할 콘텐츠 */
  children: ReactNode;
}

export function InventoryPageShell({
  tab,
  isEmpty = false,
  infoScreenProps,
  addHref,
  children,
}: InventoryPageShellProps) {
  const router = useRouter();

  return (
    <>
      <Navbar
        additionalButtons={
          <AddButton onClick={() => router.push(addHref)} />
        }
      />
      <InventorySubTabbar selected={tab} items={INVENTORY_SUB_TABS} />
      <MainContent centered={isEmpty}>
        {isEmpty ? (
          <InfoScreen {...infoScreenProps} />
        ) : (
          children
        )}
      </MainContent>
      <Tabbar activeId="inventory" />
    </>
  );
}
