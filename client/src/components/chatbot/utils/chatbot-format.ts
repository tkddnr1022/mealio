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
  return [{ label: recipe.categoryName }];
}

export function isValidSuggestedRecipe(recipe: SuggestedRecipe): boolean {
  return Number.isFinite(recipe.id) && recipe.id > 0;
}
