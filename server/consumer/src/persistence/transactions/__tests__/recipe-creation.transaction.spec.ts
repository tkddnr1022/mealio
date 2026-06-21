import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@mealio/shared';
import { RecipeCreationTransaction } from '../recipe-creation.transaction';
import { CategoryResolverService } from 'src/consumers/recipe-ingestion-persist/services/category-resolver.service';
import { IngredientMatcherService } from 'src/consumers/recipe-ingestion-persist/services/ingredient-matcher.service';
import { RecipeIngredientRepository } from '../../repositories/postgresql/recipe-ingredient.repository';
import type { RetrievedDataPayload } from 'src/consumers/recipe-ingestion-persist/validators/retrieved-data.validator';

const retrievedData: RetrievedDataPayload = {
  recipe: {
    title: '된장찌개',
    difficulty: 3,
    cookingTimeMinutes: 25,
    imageUrl: 'http://www.foodsafetykorea.go.kr/uploadimg/cook/main.png',
    nutrition: {
      calories: 250,
      carbohydrates: 8,
      protein: 12,
      fat: 6,
      sodium: 500,
    },
    cookingMethod: '끓이기',
    dishType: '찌개',
    steps: [
      {
        content: '물을 넣어 끓여요.',
        imageUrl: 'http://www.foodsafetykorea.go.kr/uploadimg/cook/step1.png',
      },
    ],
    tips: '저염 된장을 사용하세요.',
    categoryId: 1,
  },
  ingredients: [
    {
      rawName: '된장',
      normalizedName: '된장',
      ingredientAlias: '된장',
      categoryId: 3,
    },
  ],
  parseConfidence: 'high',
};

describe('RecipeCreationTransaction', () => {
  let transaction: RecipeCreationTransaction;
  let ingredientMatcher: { match: jest.Mock };
  let recipeIngredientRepository: { replaceForRecipe: jest.Mock };
  let prisma: {
    $transaction: jest.Mock;
    recipe: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    recipeStats: { upsert: jest.Mock };
  };

  beforeEach(async () => {
    ingredientMatcher = {
      match: jest.fn().mockResolvedValue({
        ingredientId: 10,
        matchMethod: 'exact',
      }),
    };
    recipeIngredientRepository = {
      replaceForRecipe: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      $transaction: jest.fn(async (fn) => fn(prisma)),
      recipe: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 99, ...data }),
          ),
        update: jest.fn(),
      },
      recipeStats: { upsert: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeCreationTransaction,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CategoryResolverService,
          useValue: { resolveRecipeCategoryId: jest.fn().mockResolvedValue(1) },
        },
        {
          provide: IngredientMatcherService,
          useValue: ingredientMatcher,
        },
        {
          provide: RecipeIngredientRepository,
          useValue: recipeIngredientRepository,
        },
      ],
    }).compile();

    transaction = module.get(RecipeCreationTransaction);
  });

  it('should persist image, nutrition, meta, and step image from retrieved_data', async () => {
    await transaction.execute({ sourceId: 123 } as never, retrievedData);

    expect(prisma.recipe.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        difficulty: 3,
        cookTime: 25,
        imageUrl: retrievedData.recipe.imageUrl,
        cookingMethod: '끓이기',
        dishType: '찌개',
        cookingTip: '저염 된장을 사용하세요.',
        nutrition: {
          calories: 250,
          carbohydrates: 8,
          protein: 12,
          fat: 6,
          sodium: 500,
        },
        instructions: [
          {
            step: 1,
            content: '물을 넣어 끓여요.',
            imageUrl: retrievedData.recipe.steps[0]?.imageUrl,
          },
        ],
      }),
    });
  });

  it('should deduplicate ingredient rows when multiple inputs resolve to same ingredientId', async () => {
    ingredientMatcher.match
      .mockResolvedValueOnce({
        ingredientId: 10,
        matchMethod: 'alias',
      })
      .mockResolvedValueOnce({
        ingredientId: 10,
        matchMethod: 'exact',
      });

    const dataWithDuplicateIngredients: RetrievedDataPayload = {
      ...retrievedData,
      ingredients: [
        {
          rawName: '키위',
          normalizedName: '키위',
          ingredientAlias: '골드키위',
          quantity: null,
          unit: null,
          categoryId: 3,
        },
        {
          rawName: '키위 1개',
          normalizedName: '키위',
          ingredientAlias: '키위',
          quantity: '1',
          unit: '개',
          categoryId: 3,
        },
      ],
    };

    await transaction.execute({ sourceId: 456 } as never, dataWithDuplicateIngredients);

    expect(recipeIngredientRepository.replaceForRecipe).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      [{ ingredientId: 10, amount: '1', unit: '개', isOptional: false }],
    );
  });
});
