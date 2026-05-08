'use client';

import { Clock3, Flame, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { RecipeDetailContent, RecipeFavoriteButton } from '@/components/recipe';
import { ShareButton } from '@/components/ui/buttons/ShareButton';
import { Thumbnail } from '@/components/ui/Thumbnail';
import type { CardTagItem } from '@/components/ui/CardTagsRow';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { useIsAuthenticated } from '@/lib/auth/auth-context';
import { useRecipeDetail } from '@/lib/queries/recipe.queries';
import type { RecipeDetail } from '@/lib/types/recipe';
import {
  toRecipeCookingTimeLabel,
  toRecipeDifficultyLabel,
  toRecipeImageUrl,
  toRecipeServingsLabel,
} from '@/components/recipe/utils/recipe-format';

const RECIPE_LIST_PATH = '/recipe' as const;

interface RecipeDetailClientPageProps {
  recipe: RecipeDetail;
}

function buildRecipeTags(recipe: RecipeDetail): CardTagItem[] {
  return [
    {
      label: toRecipeCookingTimeLabel(recipe.cookTime),
      leftIcon: <Clock3 className="size-5" aria-hidden />,
    },
    {
      label: toRecipeDifficultyLabel(recipe.difficulty),
      leftIcon: <Flame className="size-5" aria-hidden />,
    },
    {
      label: toRecipeServingsLabel(recipe.servings),
      leftIcon: <Users className="size-5" aria-hidden />,
    },
  ];
}

async function copyCurrentUrl(): Promise<void> {
  if (typeof window === 'undefined') return;
  const href = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ url: href });
      return;
    } catch {
      // 사용자가 공유 UI를 닫은 경우를 포함해 클립보드 fallback으로 진행
    }
  }

  try {
    await navigator.clipboard.writeText(href);
  } catch {
    // 클립보드 권한이 없으면 무시
  }
}

export function RecipeDetailClientPage({
  recipe,
}: RecipeDetailClientPageProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  // SSG/ISR로 prefetch된 recipe는 쿠키 미포함 응답이라 `isFavorite`이 항상 undefined이다.
  // 인증된 사용자에 한해 클라이언트에서 한 번 더 조회하여 `isFavorite` 값만 보강한다.
  // 다른 필드는 SSG 데이터를 그대로 사용해 렌더링에 영향을 주지 않는다.
  const { data: refreshedRecipe } = useRecipeDetail(recipe.id, {
    enabled: isAuthenticated,
  });

  const isFavorite = refreshedRecipe?.isFavorite ?? recipe.isFavorite ?? false;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Navbar
        displayBackButton
        displayTitle={false}
        onBack={() => router.push(RECIPE_LIST_PATH)}
        additionalButtons={
          <div className="flex items-center gap-2">
            <RecipeFavoriteButton
              recipeId={recipe.id}
              isFavorite={isFavorite}
            />
            <ShareButton onClick={() => void copyCurrentUrl()} />
          </div>
        }
      />

      <MainContent paddingX={false} paddingY={false}>
        <div className="flex w-full flex-col">
          <Thumbnail
            square={false}
            imageUrl={toRecipeImageUrl(recipe.imageUrl)}
            imageAlt={buildAriaLabel('image', recipe.title)}
          />

          <RecipeDetailContent
            headerProps={{
              category: recipe.categoryName,
              title: recipe.title,
              description: recipe.description ?? '',
            }}
            tags={buildRecipeTags(recipe)}
            ingredientsCardProps={{ ingredients: recipe.ingredients }}
            stepsCardProps={{ steps: recipe.instructions }}
          />
        </div>
      </MainContent>

      <Tabbar activeId="recipe" />
    </div>
  );
}
