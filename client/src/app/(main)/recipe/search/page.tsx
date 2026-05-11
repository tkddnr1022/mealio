import type { Metadata } from 'next';
import { RecipeSearchClientPage } from './RecipeSearchClientPage';
import { getRecipeCategories, searchRecipes } from '@/lib/api/domains';
import { withForwardedHeaders } from '@/lib/api/server';
import {
  RECIPE_SORT_KEYS,
  type RecipeSearchQuery,
  type RecipeSortKey,
} from '@/lib/types/recipe';
import {
  getMultiSearchParam,
  getSingleSearchParam,
  resolveSearchParams,
  type SearchParamRecord,
} from '@/lib/utils/search-params';

interface RecipeSearchPageProps {
  searchParams?: Promise<SearchParamRecord>;
}

const DEFAULT_SORT: RecipeSortKey = 'latest';

export const metadata: Metadata = {
  title: '레시피 검색',
};

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPositiveInt(value: string | undefined): number | undefined {
  const parsed = toInt(value);
  if (parsed === undefined) return undefined;
  return parsed > 0 ? parsed : undefined;
}

function parseDifficulty(
  value: SearchParamRecord[string],
): number[] | undefined {
  const values = getMultiSearchParam(value)
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item) && item >= 1 && item <= 5);

  return values.length > 0 ? values : undefined;
}

function parseSort(value: string | undefined): RecipeSortKey {
  if (!value) return DEFAULT_SORT;
  return RECIPE_SORT_KEYS.includes(value as RecipeSortKey)
    ? (value as RecipeSortKey)
    : DEFAULT_SORT;
}

function parseSearchQuery(searchParams?: SearchParamRecord): {
  query: RecipeSearchQuery;
  display: {
    q: string;
    sort: RecipeSortKey;
    difficulty: number[];
    cookTimeMin?: number;
    cookTimeMax?: number;
    categoryId?: number;
  };
} {
  const q = (getSingleSearchParam(searchParams?.q) ?? '').trim();
  const sort = parseSort(getSingleSearchParam(searchParams?.sort));
  const difficulty = parseDifficulty(searchParams?.difficulty);
  const cookTimeMin = toPositiveInt(
    getSingleSearchParam(searchParams?.cookTimeMin),
  );
  const cookTimeMax = toPositiveInt(
    getSingleSearchParam(searchParams?.cookTimeMax),
  );
  const categoryId = toPositiveInt(
    getSingleSearchParam(searchParams?.categoryId),
  );
  const page = toPositiveInt(getSingleSearchParam(searchParams?.page));
  const size = toPositiveInt(getSingleSearchParam(searchParams?.size));

  return {
    query: {
      q: q || undefined,
      sort: sort !== DEFAULT_SORT ? sort : undefined,
      difficulty,
      cookTimeMin,
      cookTimeMax,
      categoryId,
      page,
      size,
    },
    display: {
      q,
      sort,
      difficulty: difficulty ?? [],
      cookTimeMin,
      cookTimeMax,
      categoryId,
    },
  };
}

export default async function RecipeSearchPage({
  searchParams,
}: RecipeSearchPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const { query, display } = parseSearchQuery(resolvedSearchParams);
  const forwardedHeaders = await withForwardedHeaders();
  const [searchResult, categoriesResult] = await Promise.allSettled([
    searchRecipes(query, forwardedHeaders),
    getRecipeCategories(),
  ]);

  const recipes =
    searchResult.status === 'fulfilled' ? searchResult.value.data : [];
  const totalCount =
    searchResult.status === 'fulfilled'
      ? searchResult.value.pagination.total
      : 0;
  const categories =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value.data : [];

  const categoryName =
    display.categoryId != null
      ? categories.find((category) => category.id === display.categoryId)?.name
      : undefined;

  return (
    <RecipeSearchClientPage
      query={display.q}
      sort={display.sort}
      difficulty={display.difficulty}
      cookTimeMin={display.cookTimeMin}
      cookTimeMax={display.cookTimeMax}
      categoryId={display.categoryId}
      categoryName={categoryName}
      recipes={recipes}
      totalCount={totalCount}
    />
  );
}
