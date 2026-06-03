'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarCard } from '@/components/recipe';
import { ActionGroup } from '@/components/ui/ActionGroup';
import type { RangeSliderValue } from '@/components/ui/RangeSlider';
import { RangeSliderCard } from '@/components/ui/RangeSliderCard';
import { ToggleCard } from '@/components/ui/ToggleCard';
import { Toggle } from '@/components/ui/Toggle';
import { buildQueryString, objectToQuery } from '@/lib/api/query';
import type { RecipeCategory, RecipeSearchQuery } from '@/lib/types/recipe';
import {
  buildRecipeSearchQueryFromDraft,
  DEFAULT_RECIPE_COOK_TIME_MAX,
  DEFAULT_RECIPE_COOK_TIME_MIN,
  parseRecipeFilterDraftState,
} from '@/components/recipe/utils/recipe-search-filters';
import { RECIPE_SEARCH_PATH } from '@/lib/constants/routes.constants';

const DEFAULT_COOK_TIME_RANGE: RangeSliderValue = {
  minValue: DEFAULT_RECIPE_COOK_TIME_MIN,
  maxValue: DEFAULT_RECIPE_COOK_TIME_MAX,
};
const DIFFICULTY_OPTIONS = [
  { value: 1, label: '쉬움' },
  { value: 3, label: '보통' },
  { value: 5, label: '어려움' },
] as const;

interface RecipeFilterClientPageProps {
  categoryOptions: RecipeCategory[];
}

type RecipeFilterDraftState = ReturnType<typeof parseRecipeFilterDraftState>;

interface RecipeFilterFormProps {
  categoryOptions: RecipeCategory[];
  initialDraftState: RecipeFilterDraftState;
}

function RecipeFilterForm({
  categoryOptions,
  initialDraftState,
}: RecipeFilterFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialDraftState.keyword);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>(
    initialDraftState.selectedDifficulties,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialDraftState.selectedCategoryId,
  );
  const [cookTimeRange, setCookTimeRange] = useState<RangeSliderValue>(
    initialDraftState.cookTimeRange,
  );
  const [sliderResetKey, setSliderResetKey] = useState(0);

  const toggleDifficulty = (difficulty: number) => {
    setSelectedDifficulties((prev) => {
      if (prev.includes(difficulty)) {
        return prev.filter((value) => value !== difficulty);
      }
      return [...prev, difficulty].sort((a, b) => a - b);
    });
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const resetFilters = () => {
    setKeyword('');
    setSelectedDifficulties([]);
    setSelectedCategoryId(null);
    setCookTimeRange(DEFAULT_COOK_TIME_RANGE);
    setSliderResetKey((prev) => prev + 1);
  };

  const runSearch = () => {
    const params: RecipeSearchQuery = buildRecipeSearchQueryFromDraft({
      keyword,
      selectedDifficulties,
      selectedCategoryId,
      cookTimeRange,
    });

    const queryString = buildQueryString(objectToQuery(params));
    router.push(
      queryString ? `${RECIPE_SEARCH_PATH}?${queryString}` : RECIPE_SEARCH_PATH,
    );
  };

  return (
    <>
      <Navbar
        displayBackButton
        displayTitle={false}
        onBack={() => router.back()}
      />

      <MainContent innerClassName="gap-4 py-4">
        <SearchBarCard
          heading="검색어"
          searchBarProps={{
            value: keyword,
            onChange: (event) => setKeyword(event.target.value),
            placeholder: '검색어를 입력해 주세요',
          }}
        />

        <ToggleCard heading="난이도">
          {DIFFICULTY_OPTIONS.map((option) => (
            <Toggle
              key={option.value}
              label={option.label}
              selected={selectedDifficulties.includes(option.value)}
              onClick={() => toggleDifficulty(option.value)}
            />
          ))}
        </ToggleCard>

        <RangeSliderCard
          key={sliderResetKey}
          heading="조리 시간"
          sliderProps={{
            min: DEFAULT_COOK_TIME_RANGE.minValue,
            max: DEFAULT_COOK_TIME_RANGE.maxValue,
            unit: 'time',
            step: 5,
            defaultMinValue: DEFAULT_COOK_TIME_RANGE.minValue,
            defaultMaxValue: DEFAULT_COOK_TIME_RANGE.maxValue,
            onValueChange: setCookTimeRange,
          }}
        />

        <ToggleCard heading="카테고리">
          {categoryOptions.map((category) => (
            <Toggle
              key={category.id}
              label={category.name}
              selected={selectedCategoryId === category.id}
              onClick={() => toggleCategory(category.id)}
            />
          ))}
        </ToggleCard>
      </MainContent>

      <ActionGroup
        leftButtonProps={{
          children: '초기화',
          onClick: resetFilters,
        }}
        rightButtonProps={{
          children: '검색',
          onClick: runSearch,
        }}
      />
    </>
  );
}

export function RecipeFilterClientPage({
  categoryOptions,
}: RecipeFilterClientPageProps) {
  const searchParams = useSearchParams();
  const draftKey = searchParams.toString();
  const initialDraftState = useMemo(
    () => parseRecipeFilterDraftState(new URLSearchParams(draftKey)),
    [draftKey],
  );

  return (
    <RecipeFilterForm
      key={draftKey}
      categoryOptions={categoryOptions}
      initialDraftState={initialDraftState}
    />
  );
}
