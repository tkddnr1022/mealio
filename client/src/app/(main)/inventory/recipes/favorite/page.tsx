import type { Metadata } from 'next';

import { InventoryFavoriteRecipesClientPage } from './InventoryFavoriteRecipesClientPage';

export const metadata: Metadata = {
  title: '관심 레시피',
  description:
    '저장해 둔 관심 레시피 목록입니다. 빠르게 다시 열어볼 수 있습니다.',
  robots: { index: false, follow: false },
};

export default function InventoryFavoriteRecipesPage() {
  return <InventoryFavoriteRecipesClientPage />;
}
