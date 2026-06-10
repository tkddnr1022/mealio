import { Prisma } from '@mealio/shared/prisma-client';
import { RecipeSearchQueryService } from './recipe-search-query.service';

describe('RecipeSearchQueryService', () => {
  const createService = () => {
    const findMany = jest.fn().mockResolvedValue([]);
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

  it('fetchRecipesByIds는 후보 ID와 hard constraint만 적용한다', async () => {
    const { findMany, service } = createService();

    await service.fetchRecipesByIds([101, 101, -1], {
      excludeIngredientIds: [30],
      excludeIngredientNames: ['우유'],
    });

    const findManyArg = findMany.mock.calls[0][0];
    expect(findManyArg.where).toEqual({
      AND: [
        { isPublished: true },
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
      id: { in: [101] },
    });
  });

  it('fetchRecipesByIds는 빈 ID 목록이면 조회하지 않는다', async () => {
    const { findMany, service } = createService();

    const result = await service.fetchRecipesByIds([], {
      excludeIngredientIds: [30],
    });

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
