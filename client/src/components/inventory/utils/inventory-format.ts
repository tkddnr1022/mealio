import type { InventoryIngredient } from '@/lib/types/inventory';
import { buildAriaLabel } from '@/lib/utils/a11y';

export function toInventoryIngredientCountText(count: number): string {
  return `${count}개의 재료`;
}

export function toInventoryIngredientRemoveAriaLabel(
  ingredient: Pick<InventoryIngredient, 'name'>,
): string {
  const nameText = ingredient.name.trim();
  return buildAriaLabel('button', nameText ? `${nameText} 제거` : '');
}
