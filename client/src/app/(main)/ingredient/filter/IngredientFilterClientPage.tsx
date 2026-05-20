'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarCard } from '@/components/recipe';
import { ActionGroup } from '@/components/ui/ActionGroup';
import { ToggleCard } from '@/components/ui/ToggleCard';
import { Toggle } from '@/components/ui/Toggle';
import { ListLoadMore } from '@/components/ui/ListLoadMore';
import { IngredientSearchResult } from '@/components/inventory';
import { useIngredientSearchInfinite } from '@/lib/queries/ingredient.queries';
import {
  useAddMyOwnedIngredients,
  useAddMyFavoriteIngredients,
} from '@/lib/queries/inventory.queries';
import { INGREDIENT_SEARCH_PAGE_SIZE } from '@/lib/config/pagination.config';
import { toInventoryIngredientCountText } from '@/components/inventory/utils/inventory-format';
import type { Ingredient, IngredientCategory } from '@/lib/types/ingredient';
import type { InventoryIngredient } from '@/lib/types/inventory';

type InventoryType = 'owned' | 'favorites';

const SEARCH_DEBOUNCE_MS = 300;

function toInventoryIngredient(item: Ingredient): InventoryIngredient {
  return { id: item.id, name: item.name, categoryId: item.categoryId };
}

interface IngredientFilterClientPageProps {
  categoryOptions: IngredientCategory[];
}

export function IngredientFilterClientPage({
  categoryOptions,
}: IngredientFilterClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type: InventoryType =
    searchParams.get('type') === 'favorites' ? 'favorites' : 'owned';
  const currentUrl = usePathname();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>(
    [],
  );

  useEffect(() => {
    debounceRef.current = setTimeout(
      () => setDebouncedKeyword(keyword),
      SEARCH_DEBOUNCE_MS,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword]);

  const searchQuery = useMemo(
    () => ({
      q: debouncedKeyword.trim() || undefined,
      size: INGREDIENT_SEARCH_PAGE_SIZE,
      categoryId:
        selectedCategoryIds.length === 1 ? selectedCategoryIds[0] : undefined,
    }),
    [debouncedKeyword, selectedCategoryIds],
  );

  const {
    data: ingredientData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useIngredientSearchInfinite(searchQuery, {
    meta: {
      currentUrl,
    },
  });

  const displayItems: InventoryIngredient[] = useMemo(() => {
    const raw = ingredientData?.pages.flatMap((page) => page.data) ?? [];
    const mapped = raw.map(toInventoryIngredient);
    // 다중 카테고리 선택 시에는 현재 로드된 페이지 안에서만 필터한다.
    if (selectedCategoryIds.length <= 1) return mapped;
    return mapped.filter(
      (item) =>
        item.categoryId != null &&
        selectedCategoryIds.includes(item.categoryId),
    );
  }, [ingredientData?.pages, selectedCategoryIds]);

  const countText = useMemo(() => {
    const total = ingredientData?.pages[0]?.pagination.total;
    if (typeof total === 'number') {
      return toInventoryIngredientCountText(total);
    }
    return toInventoryIngredientCountText(displayItems.length);
  }, [ingredientData?.pages, displayItems.length]);

  const addOwnedMutation = useAddMyOwnedIngredients({
    meta: {
      currentUrl,
    },
  });
  const addFavoriteMutation = useAddMyFavoriteIngredients({
    meta: {
      currentUrl,
    },
  });

  const toggleCategory = useCallback((categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  const toggleIngredient = useCallback((ingredient: InventoryIngredient) => {
    setSelectedIngredientIds((prev) =>
      prev.includes(ingredient.id)
        ? prev.filter((id) => id !== ingredient.id)
        : [...prev, ingredient.id],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setKeyword('');
    setDebouncedKeyword('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSelectedCategoryIds([]);
    setSelectedIngredientIds([]);
  }, []);

  const handleAdd = useCallback(() => {
    if (selectedIngredientIds.length === 0) return;

    const mutation =
      type === 'favorites' ? addFavoriteMutation : addOwnedMutation;

    mutation.mutate(selectedIngredientIds, {
      onSuccess: () => router.back(),
    });
  }, [
    selectedIngredientIds,
    type,
    addFavoriteMutation,
    addOwnedMutation,
    router,
  ]);

  const isPending = addOwnedMutation.isPending || addFavoriteMutation.isPending;

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
            onChange: (e) => setKeyword(e.target.value),
            placeholder: '검색어를 입력해 주세요',
          }}
        />

        <ToggleCard heading="카테고리">
          {categoryOptions.map((category) => (
            <Toggle
              key={category.id}
              label={category.name}
              selected={selectedCategoryIds.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            />
          ))}
        </ToggleCard>

        <IngredientSearchResult
          items={displayItems}
          countText={countText}
          selectedIngredientIds={selectedIngredientIds}
          onClickIngredient={toggleIngredient}
        />

        <ListLoadMore
          hasMore={hasNextPage ?? false}
          isLoading={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      </MainContent>

      <ActionGroup
        leftButtonProps={{
          children: '초기화',
          onClick: resetFilters,
        }}
        rightButtonProps={{
          children:
            selectedIngredientIds.length > 0
              ? `추가하기 (${selectedIngredientIds.length})`
              : '추가하기',
          onClick: handleAdd,
          disabled: selectedIngredientIds.length === 0 || isPending,
        }}
      />
    </>
  );
}
