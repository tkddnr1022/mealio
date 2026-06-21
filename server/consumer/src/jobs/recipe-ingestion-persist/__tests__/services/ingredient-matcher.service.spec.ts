import { Test, TestingModule } from '@nestjs/testing';
import { IngredientMatcherService } from '../../domains/ingredient-matcher.domain';
import { CategoryResolverService } from '../../domains/category-resolver.domain';

describe('IngredientMatcherService', () => {
  let service: IngredientMatcherService;
  let tx: {
    ingredient: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };
  let categoryResolver: jest.Mocked<
    Pick<CategoryResolverService, 'resolveIngredientCategoryId'>
  >;

  beforeEach(async () => {
    tx = {
      ingredient: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    categoryResolver = {
      resolveIngredientCategoryId: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientMatcherService,
        { provide: CategoryResolverService, useValue: categoryResolver },
      ],
    }).compile();

    service = module.get(IngredientMatcherService);
  });

  const baseIngredient = {
    rawName: '파(대파)',
    normalizedName: '파',
    ingredientAlias: '대파',
    categoryId: 1,
  };

  it('should match by ingredientAlias', async () => {
    tx.ingredient.findFirst.mockResolvedValueOnce({ id: 4, name: '대파' });

    const result = await service.match(tx as never, baseIngredient);

    expect(result).toEqual({ ingredientId: 4, matchMethod: 'alias' });
    expect(tx.ingredient.create).not.toHaveBeenCalled();
  });

  it('should match by normalizedName when alias misses', async () => {
    tx.ingredient.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 5, name: '달걀' });

    const result = await service.match(tx as never, {
      ...baseIngredient,
      ingredientAlias: '없는이름',
      normalizedName: '달걀',
    });

    expect(result).toEqual({ ingredientId: 5, matchMethod: 'exact' });
  });

  it('should create ingredient when no match', async () => {
    tx.ingredient.findFirst.mockResolvedValue(null);
    tx.ingredient.create.mockResolvedValue({ id: 99, name: '새재료' });

    const result = await service.match(tx as never, {
      ...baseIngredient,
      ingredientAlias: '새재료',
      normalizedName: '새재료',
    });

    expect(result).toEqual({ ingredientId: 99, matchMethod: 'new' });
    expect(tx.ingredient.create).toHaveBeenCalledWith({
      data: { name: '새재료', categoryId: 1 },
    });
  });
});
