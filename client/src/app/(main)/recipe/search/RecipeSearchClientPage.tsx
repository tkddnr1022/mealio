'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Tabbar } from '@/components/layout/Tabbar';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { RecipeList, SearchResultHeader } from '@/components/recipe';
import type { DropdownOption } from '@/components/ui/dropdown/DropdownList';
import { buildQueryString, objectToQuery } from '@/lib/api/query';
import {
  RECIPE_SORT_KEYS,
  type RecipeSearchQuery,
  type RecipeSortKey,
  type RecipeSummary,
} from '@/lib/types/recipe';
import { toRecipeDifficultyLabel } from '@/components/recipe/utils/recipe-format';

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
const DEFAULT_COOK_TIME_MIN = 0;
const DEFAULT_COOK_TIME_MAX = 120;

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
  const hasMin = typeof min === 'number' && min > DEFAULT_COOK_TIME_MIN;
  const hasMax = typeof max === 'number' && max < DEFAULT_COOK_TIME_MAX;

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

  const selectedSort = isRecipeSortKey(sort) ? sort : DEFAULT_SORT;
  const selectedSortLabel = getSortLabel(selectedSort);

  const difficultyLabels = difficulty.map((value) =>
    toRecipeDifficultyLabel(value),
  );
  const cookTimeChipLabel = toCookTimeChipLabel(cookTimeMin, cookTimeMax);

  const chips: string[] = [
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
      <SearchResultHeader
        searchResultTopProps={{
          query,
          onBackClick: () => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push(RECIPE_PATH);
          },
          searchBarProps: {
            onClick: () => router.push(FILTER_PAGE_PATH),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(FILTER_PAGE_PATH);
              }
            },
          },
        }}
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
          <RecipeList recipes={recipes} />
        ) : (
          <InfoScreen
            className="h-full justify-center gap-6"
            title="검색 결과가 없습니다"
            message="다른 검색 조건을 시도해 보세요"
            icon={<Search className="size-8" strokeWidth={2} aria-hidden />}
            buttonLabel="검색 조건 변경"
            buttonHref={FILTER_PAGE_PATH}
          />
        )}
      </MainContent>

      <Tabbar activeId="recipe" />
    </div>
  );
}
