import { Test, TestingModule } from '@nestjs/testing';
import { IngredientMatcherService } from '../../domains/ingredient-matcher.domain';
import { CategoryResolverService } from '../../domains/category-resolver.domain';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';

describe('IngredientMatcherService', () => {
  let service: IngredientMatcherService;
  let tx: object;
  let ingredientRepository: {
    findFirstByNameInTx: jest.Mock;
    createInTx: jest.Mock;
  };
  let categoryResolver: jest.Mocked<
    Pick<CategoryResolverService, 'resolveIngredientCategoryId'>
  >;

  beforeEach(async () => {
    tx = {};
    ingredientRepository = {
      findFirstByNameInTx: jest.fn(),
      createInTx: jest.fn(),
    };
    categoryResolver = {
      resolveIngredientCategoryId: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientMatcherService,
        { provide: CategoryResolverService, useValue: categoryResolver },
        { provide: IngredientRepository, useValue: ingredientRepository },
        {
          provide: IngredientEmbeddingRepository,
          useValue: { searchTopK: jest.fn().mockResolvedValue([]) },
        },
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
    ingredientRepository.findFirstByNameInTx.mockResolvedValueOnce({
      id: 4,
      name: '대파',
    });

    const result = await service.match(tx as never, baseIngredient);

    expect(result).toEqual({ ingredientId: 4, matchMethod: 'alias' });
    expect(ingredientRepository.createInTx).not.toHaveBeenCalled();
  });

  it('should match by normalizedName when alias misses', async () => {
    ingredientRepository.findFirstByNameInTx
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
    ingredientRepository.findFirstByNameInTx.mockResolvedValue(null);
    ingredientRepository.createInTx.mockResolvedValue({
      id: 99,
      name: '새재료',
    });

    const result = await service.match(tx as never, {
      ...baseIngredient,
      ingredientAlias: '새재료',
      normalizedName: '새재료',
    });

    expect(result).toEqual({ ingredientId: 99, matchMethod: 'new' });
    expect(ingredientRepository.createInTx).toHaveBeenCalledWith(tx, {
      name: '새재료',
      categoryId: 1,
    });
  });
});
