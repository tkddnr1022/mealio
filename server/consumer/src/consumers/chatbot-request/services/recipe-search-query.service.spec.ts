import { Test } from '@nestjs/testing';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import { RecipeSearchQueryService } from './recipe-search-query.service';

describe('RecipeSearchQueryService', () => {
  it('포함/제외 재료와 기본 조건을 where에 함께 조합한다', async () => {
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.RecipeFindManyArgs]>()
      .mockResolvedValue([]);
    const prismaService = {
      recipe: {
        findMany,
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        RecipeSearchQueryService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    const service = module.get(RecipeSearchQueryService);
    await service.searchRecipes({
      maxCookTime: 20,
      servings: 2,
      recipeCategoryIds: [1, 1, -1],
      ingredientCategoryIds: [2, 0],
      includeIngredientIds: [10, 10, 0],
      includeIngredientNames: ['양파', '  파 '],
      excludeIngredientIds: [30, -2],
      excludeIngredientNames: ['우유', ' 우유 '],
    });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      isPublished: true,
      cookTime: { lte: 20 },
      servings: 2,
      categoryId: { in: [1] },
      AND: [
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

  it('servings가 유효하지 않으면 인분 필터를 적용하지 않는다', async () => {
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.RecipeFindManyArgs]>()
      .mockResolvedValue([]);
    const prismaService = {
      recipe: {
        findMany,
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        RecipeSearchQueryService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    const service = module.get(RecipeSearchQueryService);
    await service.searchRecipes({ servings: 0 });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({ isPublished: true });
  });

  it('조건이 없으면 AND 없이 기본 published 조건만 조회한다', async () => {
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.RecipeFindManyArgs]>()
      .mockResolvedValue([]);
    const prismaService = {
      recipe: {
        findMany,
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        RecipeSearchQueryService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    const service = module.get(RecipeSearchQueryService);
    await service.searchRecipes({});

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({ isPublished: true });
  });
});
