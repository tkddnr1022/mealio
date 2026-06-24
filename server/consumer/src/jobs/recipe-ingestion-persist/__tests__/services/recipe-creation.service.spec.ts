import { Test, TestingModule } from '@nestjs/testing';
import { RecipeCreationService } from '../../domains/recipe-creation.domain';
import { CategoryResolverService } from '../../domains/category-resolver.domain';
import { IngredientMatcherService } from '../../domains/ingredient-matcher.domain';
import { RecipeIngredientRepository } from 'src/persistence/repositories/postgresql/recipe-ingredient.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import type { RetrievedDataPayload } from '../../validators/retrieved-data.validator';

const parse_retrievedData: RetrievedDataPayload = {
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

describe('RecipeCreationService', () => {
  let service: RecipeCreationService;
  let ingredientMatcher: { match: jest.Mock };
  let recipeIngredientRepository: { replaceForRecipe: jest.Mock };
  let recipeRepository: {
    runInTransaction: jest.Mock;
    upsertForIngestionInTx: jest.Mock;
    initializeStatsInTx: jest.Mock;
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

    recipeRepository = {
      runInTransaction: jest.fn(async (fn) => fn({})),
      upsertForIngestionInTx: jest.fn().mockResolvedValue({ id: 99 }),
      initializeStatsInTx: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeCreationService,
        { provide: RecipeRepository, useValue: recipeRepository },
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
        {
          provide: OpenAIService,
          useValue: { createEmbeddings: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get(RecipeCreationService);
  });

  it('should persist image, nutrition, meta, and step image from parse_retrieved_data', async () => {
    await service.execute({ sourceId: 123 } as never, parse_retrievedData);

    expect(recipeRepository.upsertForIngestionInTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        difficulty: 3,
        cookTime: 25,
        imageUrl: parse_retrievedData.recipe.imageUrl,
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
            imageUrl: parse_retrievedData.recipe.steps[0]?.imageUrl,
          },
        ],
      }),
    );
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
      ...parse_retrievedData,
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

    await service.execute(
      { sourceId: 456 } as never,
      dataWithDuplicateIngredients,
    );

    expect(recipeIngredientRepository.replaceForRecipe).toHaveBeenCalledWith(
      expect.anything(),
      99,
      [{ ingredientId: 10, amount: '1', unit: '개', isOptional: false }],
    );
  });
});
