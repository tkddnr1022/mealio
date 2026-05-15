import type { Metadata } from 'next';

import { InventoryFavoriteIngredientsClientPage } from './InventoryFavoriteIngredientsClientPage';

export const metadata: Metadata = {
  title: '관심 재료',
  description:
    '관심 등록한 재료 목록입니다. 추천·검색에 반영되어 맞춤 레시피를 찾는 데 도움이 됩니다.',
  robots: { index: false, follow: false },
};

export default function InventoryFavoriteIngredientsPage() {
  return <InventoryFavoriteIngredientsClientPage />;
}
