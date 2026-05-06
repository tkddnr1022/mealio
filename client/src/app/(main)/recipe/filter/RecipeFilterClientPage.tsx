'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const DEFAULT_COOK_TIME_RANGE: RangeSliderValue = { minValue: 0, maxValue: 120 };
const DIFFICULTY_OPTIONS = [
  { value: 1, label: '쉬움' },
  { value: 3, label: '보통' },
  { value: 5, label: '어려움' },
] as const;
const RECIPE_PATH = '/recipe' as const;
const RECIPE_SEARCH_PATH = '/recipe/search' as const;

interface RecipeFilterClientPageProps {
  categoryOptions: RecipeCategory[];
}

export function RecipeFilterClientPage({
  categoryOptions,
}: RecipeFilterClientPageProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [cookTimeRange, setCookTimeRange] =
    useState<RangeSliderValue>(DEFAULT_COOK_TIME_RANGE);
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
    const trimmedKeyword = keyword.trim();
    const params: RecipeSearchQuery = {
      q: trimmedKeyword || undefined,
      difficulty:
        selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      categoryId: selectedCategoryId ?? undefined,
      cookTimeMin:
        cookTimeRange.minValue > DEFAULT_COOK_TIME_RANGE.minValue
          ? cookTimeRange.minValue
          : undefined,
      cookTimeMax:
        cookTimeRange.maxValue < DEFAULT_COOK_TIME_RANGE.maxValue
          ? cookTimeRange.maxValue
          : undefined,
    };

    const queryString = buildQueryString(objectToQuery(params));
    router.push(
      queryString
        ? `${RECIPE_SEARCH_PATH}?${queryString}`
        : RECIPE_SEARCH_PATH,
    );
  };

  return (
    <>
      <Navbar
        variant="BackOnly"
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }
          router.push(RECIPE_PATH);
        }}
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
