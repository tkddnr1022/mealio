'use client';

import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { InfoScreen } from '@/components/layout/InfoScreen';
import {
  RecipeFavoriteButton,
  RecipeList,
  SearchResultHeader,
} from '@/components/recipe';
import type { DropdownOption } from '@/components/ui/dropdown/DropdownList';
import { buildQueryString, objectToQuery } from '@/lib/api/query';
import {
  RECIPE_SORT_KEYS,
  type RecipeSearchQuery,
  type RecipeSortKey,
  type RecipeSummary,
} from '@/lib/types/recipe';
import { toRecipeDifficultyLabel } from '@/components/recipe/utils/recipe-format';
import { FilterButton } from '@/components/ui/buttons/FilterButton';
import {
  buildRecipeFilterHref,
  DEFAULT_RECIPE_COOK_TIME_MAX,
  DEFAULT_RECIPE_COOK_TIME_MIN,
} from '@/components/recipe/utils/recipe-search-filters';
import { useIsAuthenticated } from '@/lib/auth/auth-context';
import { useMyFavoriteRecipeIds } from '@/lib/queries/inventory.queries';

const FILTER_PAGE_PATH = '/recipe/filter' as const;
const SEARCH_PAGE_PATH = '/recipe/search' as const;
const RECIPE_PATH = '/recipe' as const;

const SORT_OPTIONS: readonly DropdownOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'cookTime', label: '조리시간순' },
  { value: 'difficulty', label: '난이도순' },
  { value: 'viewCount', label: '조회순' },
  { value: 'likeCount', label: '좋아요순' },
] as const;

const DEFAULT_SORT: RecipeSortKey = 'latest';

interface RecipeSearchClientPageProps {
  query: string;
  sort: RecipeSortKey;
  difficulty: number[];
  cookTimeMin?: number;
  cookTimeMax?: number;
  categoryId?: number;
  categoryName?: string;
  recipes: RecipeSummary[];
  totalCount: number;
}

function isRecipeSortKey(value: string): value is RecipeSortKey {
  return RECIPE_SORT_KEYS.includes(value as RecipeSortKey);
}

function getSortLabel(sort: RecipeSortKey): string {
  return (
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? '최신순'
  );
}

function toCookTimeChipLabel(min?: number, max?: number): string | null {
  const hasMin = typeof min === 'number' && min > DEFAULT_RECIPE_COOK_TIME_MIN;
  const hasMax = typeof max === 'number' && max < DEFAULT_RECIPE_COOK_TIME_MAX;

  if (hasMin && hasMax) return `${min}~${max}분`;
  if (hasMin && typeof min === 'number') return `${min}분 이상`;
  if (hasMax && typeof max === 'number') return `${max}분 이하`;
  return null;
}

export function RecipeSearchClientPage({
  query,
  sort,
  difficulty,
  cookTimeMin,
  cookTimeMax,
  categoryId,
  categoryName,
  recipes,
  totalCount,
}: RecipeSearchClientPageProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { data: favoriteIdsData } = useMyFavoriteRecipeIds({
    enabled: isAuthenticated,
  });

  const favoriteIdSet = useMemo(
    () => new Set(favoriteIdsData?.favoriteRecipeIds ?? []),
    [favoriteIdsData],
  );

  const selectedSort = isRecipeSortKey(sort) ? sort : DEFAULT_SORT;
  const selectedSortLabel = getSortLabel(selectedSort);

  const difficultyLabels = difficulty.map((value) =>
    toRecipeDifficultyLabel(value),
  );
  const queryChipLabel = query.trim() ? `'${query.trim()}'` : null;
  const cookTimeChipLabel = toCookTimeChipLabel(cookTimeMin, cookTimeMax);

  const chips: string[] = [
    ...(queryChipLabel ? [queryChipLabel] : []),
    ...difficultyLabels,
    ...(cookTimeChipLabel ? [cookTimeChipLabel] : []),
    ...(categoryName ? [categoryName] : []),
  ];

  const pushSearch = (nextQuery: RecipeSearchQuery) => {
    const queryString = buildQueryString(objectToQuery(nextQuery));
    router.push(
      queryString ? `${SEARCH_PAGE_PATH}?${queryString}` : SEARCH_PAGE_PATH,
    );
  };

  const buildCurrentQuery = (): RecipeSearchQuery => ({
    q: query || undefined,
    sort: selectedSort !== DEFAULT_SORT ? selectedSort : undefined,
    difficulty: difficulty.length > 0 ? difficulty : undefined,
    cookTimeMin,
    cookTimeMax,
    categoryId,
  });

  const handleRemoveChip = (_index: number, label: string) => {
    const current = buildCurrentQuery();

    if (queryChipLabel === label) {
      pushSearch({
        ...current,
        q: undefined,
      });
      return;
    }

    if (difficultyLabels.includes(label)) {
      const removeIndex = difficultyLabels.indexOf(label);
      const nextDifficulty = [...difficulty];
      nextDifficulty.splice(removeIndex, 1);
      pushSearch({
        ...current,
        difficulty: nextDifficulty.length > 0 ? nextDifficulty : undefined,
      });
      return;
    }

    if (cookTimeChipLabel === label) {
      pushSearch({
        ...current,
        cookTimeMin: undefined,
        cookTimeMax: undefined,
      });
      return;
    }

    if (categoryName === label) {
      pushSearch({
        ...current,
        categoryId: undefined,
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background-primary">
      <Navbar
        displayBackButton
        displayTitle={false}
        onBack={() => router.push(RECIPE_PATH)}
        additionalButtons={
          <FilterButton
            onClick={() =>
              router.push(
                buildRecipeFilterHref(FILTER_PAGE_PATH, buildCurrentQuery()),
              )
            }
          />
        }
      />

      <SearchResultHeader
        searchResultMetaProps={{
          totalCount,
          filterDropdownProps: {
            label: selectedSortLabel,
            options: SORT_OPTIONS,
            selectedValue: selectedSort,
            onSelect: (option) => {
              if (!isRecipeSortKey(option.value)) return;
              pushSearch({
                ...buildCurrentQuery(),
                sort: option.value === DEFAULT_SORT ? undefined : option.value,
              });
            },
          },
        }}
        chipsRowProps={{
          labels: chips,
          onRemoveChip: handleRemoveChip,
        }}
      />

      <MainContent innerClassName="py-4 px-4" scroll={recipes.length > 0}>
        {recipes.length > 0 ? (
          <RecipeList
            recipes={recipes}
            favoriteButtonRenderer={(recipe) => (
              <RecipeFavoriteButton
                recipeId={recipe.id}
                isFavorite={favoriteIdSet.has(recipe.id)}
              />
            )}
          />
        ) : (
          <InfoScreen
            className="h-full justify-center gap-6"
            title="검색 결과가 없습니다"
            message="다른 검색 조건을 시도해 보세요"
            icon={<Search className="size-8" strokeWidth={2} aria-hidden />}
            buttonLabel="검색 조건 변경"
            buttonHref={buildRecipeFilterHref(
              FILTER_PAGE_PATH,
              buildCurrentQuery(),
            )}
          />
        )}
      </MainContent>

      <Tabbar activeId="recipe" />
    </div>
  );
}
