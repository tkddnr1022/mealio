import { Test, TestingModule } from '@nestjs/testing';
import { RecipeIngredientRepository } from './recipe-ingredient.repository';
import { PrismaService } from '@cook/shared';

describe('RecipeIngredientRepository', () => {
  let repository: RecipeIngredientRepository;
  let prisma: PrismaService;

  const mockRecipeIngredient: any = {
    id: 1n,
    recipeId: 1n,
    ingredientId: 1n,
    amount: 1,
    unit: 'ts',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    recipeIngredient: {
      findMany: jest.fn().mockResolvedValue([mockRecipeIngredient]),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue(mockRecipeIngredient),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeIngredientRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<RecipeIngredientRepository>(
      RecipeIngredientRepository,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByRecipeId', () => {
    it('should find recipe ingredients by recipe id', async () => {
      const result = await repository.findByRecipeId(1n);
      expect(prisma.recipeIngredient.findMany).toHaveBeenCalledWith({
        where: { recipeId: 1n },
        include: { ingredient: true },
      });
      expect(result).toEqual([mockRecipeIngredient]);
    });
  });

  // createMany, update, deleteByRecipeId는 producer에서 제거됨 (Command는 consumer에서 이벤트로 처리)
});
