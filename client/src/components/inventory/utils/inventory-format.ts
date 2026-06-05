import {
  Apple,
  Beef,
  Egg,
  Fish,
  Milk,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { buildAriaLabel } from '@/lib/utils/a11y';

const CATEGORY_ICON_MAP: ReadonlyMap<number, LucideIcon> = new Map([
  [1, Apple],
  [2, Beef],
  [3, Egg],
  [4, Fish],
  [5, Milk],
  [6, Wheat],
]);

const DEFAULT_CATEGORY_ICON: LucideIcon = Apple;

export function getIngredientCategoryIcon(
  categoryId: number | null,
): LucideIcon {
  if (categoryId == null) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICON_MAP.get(categoryId) ?? DEFAULT_CATEGORY_ICON;
}

export function toInventoryIngredientCountText(count: number): string {
  return `${count}개의 재료`;
}

export function toInventoryIngredientRemoveAriaLabel(
  ingredient: Pick<InventoryIngredient, 'name'>,
): string {
  const nameText = ingredient.name.trim();
  return buildAriaLabel('button', nameText ? `${nameText} 제거` : '');
}
