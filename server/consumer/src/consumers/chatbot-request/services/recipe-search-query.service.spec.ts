import { Test } from '@nestjs/testing';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import { RecipeSearchQueryService } from './recipe-search-query.service';

describe('RecipeSearchQueryService', () => {
  const createService = () => {
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.RecipeFindManyArgs]>()
      .mockResolvedValue([]);
    const prismaService = {
      recipe: {
        findMany,
      },
    };

    return {
      findMany,
      service: new RecipeSearchQueryService(prismaService as never),
    };
  };

  it('포함/제외 재료와 기본 조건을 AND 배열로 조합한다', async () => {
    const { findMany, service } = createService();

    await service.searchRecipes({
      cookTime: { lte: 20 },
      servings: { gte: 2 },
      recipeCategoryIds: [1, 1, -1],
      ingredientCategoryIds: [2, 0],
      includeIngredientIds: [10, 10, 0],
      includeIngredientNames: ['양파', '  파 '],
      excludeIngredientIds: [30, -2],
      excludeIngredientNames: ['우유', ' 우유 '],
    });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      AND: [
        { isPublished: true },
        { cookTime: { lte: 20 } },
        { servings: { gte: 2 } },
        { categoryId: { in: [1] } },
        {
          recipeIngredients: {
            some: {
              ingredient: {
                categoryId: { in: [2] },
              },
            },
          },
        },
        {
          recipeIngredients: {
            some: {
              ingredientId: { in: [10] },
            },
          },
        },
        {
          recipeIngredients: {
            some: {
              ingredient: {
                name: {
                  contains: '양파',
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        },
        {
          recipeIngredients: {
            some: {
              ingredient: {
                name: {
                  contains: '파',
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        },
        {
          recipeIngredients: {
            none: {
              ingredientId: { in: [30] },
            },
          },
        },
        {
          recipeIngredients: {
            none: {
              ingredient: {
                OR: [
                  {
                    name: {
                      contains: '우유',
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    });
  });

  it('cookTime·servings 범위 객체로 gte/lte를 동시에 적용한다', async () => {
    const { findMany, service } = createService();

    await service.searchRecipes({
      cookTime: { gte: 10, lte: 30 },
      servings: { gte: 2, lte: 4 },
    });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      AND: [
        { isPublished: true },
        { cookTime: { gte: 10, lte: 30 } },
        { servings: { gte: 2, lte: 4 } },
      ],
    });
  });

  it('유효하지 않은 범위 값은 필터에 반영하지 않는다', async () => {
    const { findMany, service } = createService();

    await service.searchRecipes({
      servings: { gte: 0 },
      cookTime: { lte: -1 },
    });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      AND: [{ isPublished: true }],
    });
  });

  it('조건이 없으면 published 조건만 AND로 조회한다', async () => {
    const { findMany, service } = createService();

    await service.searchRecipes({});

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      AND: [{ isPublished: true }],
    });
  });
});
