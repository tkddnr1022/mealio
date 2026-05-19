import {
  toRecipeCookingTimeLabel,
  toRecipeDifficultyLabel,
} from '@/components/recipe/utils/recipe-format';
import type { MiniTagItem } from '@/components/ui/MiniTagsRow';
import type { DateInput } from '@/lib/utils/date';
import { formatMeridiemTime, formatRelativeTime } from '@/lib/utils/date';
import type { SuggestedRecipe } from '@/lib/types/chatbot';

export function toConversationHref(conversationId: string): string {
  return `/chatbot/${encodeURIComponent(conversationId)}`;
}

export function toRecipeDetailHref(recipeId: number): string {
  return `/recipe/${encodeURIComponent(String(recipeId))}`;
}

export function toChatListTimestampLabel(timestamp: DateInput): string {
  return formatRelativeTime(timestamp);
}

export function toChatBubbleTimestampLabel(timestamp: DateInput): string {
  return formatMeridiemTime(timestamp);
}

export function toSuggestedRecipeTagItems(
  recipe: SuggestedRecipe,
): readonly MiniTagItem[] {
  const items: MiniTagItem[] = [{ label: recipe.categoryName }];
  if (recipe.cookTime != null && recipe.cookTime > 0) {
    items.push({ label: toRecipeCookingTimeLabel(recipe.cookTime) });
  }
  if (recipe.difficulty != null && recipe.difficulty > 0) {
    items.push({ label: toRecipeDifficultyLabel(recipe.difficulty) });
  }
  return items;
}

export function isValidSuggestedRecipe(recipe: SuggestedRecipe): boolean {
  return Number.isFinite(recipe.id) && recipe.id > 0;
}
