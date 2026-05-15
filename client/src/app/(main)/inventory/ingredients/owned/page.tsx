import type { Metadata } from 'next';

import { InventoryOwnedIngredientsClientPage } from './InventoryOwnedIngredientsClientPage';

export const metadata: Metadata = {
  title: '보유 재료',
  description:
    '집에 있는 재료 목록입니다. 보유 재료를 바탕으로 활용 가능한 레시피를 찾을 수 있습니다.',
  robots: { index: false, follow: false },
};

export default function InventoryOwnedIngredientsPage() {
  return <InventoryOwnedIngredientsClientPage />;
}
