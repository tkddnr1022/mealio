import { Test, TestingModule } from '@nestjs/testing';
import { RecipeRepository } from './recipe.repository';
import { PrismaService } from '@cook/shared';

describe('RecipeRepository', () => {
  let repository: RecipeRepository;
  let prisma: PrismaService;

  const mockRecipe: any = {
    id: 1n,
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    cookTime: 30,
    difficulty: 3,
    authorId: 1n,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    recipe: {
      findUnique: jest.fn().mockResolvedValue(mockRecipe),
      findMany: jest.fn().mockResolvedValue([mockRecipe]),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<RecipeRepository>(RecipeRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a recipe by id (published only)', async () => {
      const result = await repository.findById(1n);
      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 1n, isPublished: true },
        include: {
          categoryMeta: {
            select: { id: true, key: true, name: true },
          },
          recipeIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRecipe);
    });
  });

  // create, createWithIngredients는 producer에서 제거됨 (Command는 consumer에서 이벤트로 처리)

  describe('searchRecipes', () => {
    it('should search recipes', async () => {
      const params = { difficulty: 3, take: 10 };
      const result = await repository.searchRecipes(params as any);
      expect(prisma.recipe.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockRecipe]);
    });
  });

  describe('searchByKeyword', () => {
    it('키워드가 없으면 제목·설명 OR·AND 없이 공개 여부만 조건으로 조회한다', async () => {
      await repository.searchByKeyword({
        page: 1,
        size: 20,
        sort: 'latest',
      });
      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
        }),
      );
    });
  });
});
