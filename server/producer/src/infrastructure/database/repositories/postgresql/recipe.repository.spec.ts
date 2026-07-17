import { Test, TestingModule } from '@nestjs/testing';
import { RecipeRepository } from './recipe.repository';
import { PrismaService } from '@mealio/shared';

describe('RecipeRepository', () => {
  let repository: RecipeRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockRecipe: any = {
    id: 1,
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    cookTime: 30,
    difficulty: 3,
    categoryId: 1,
    servings: 2,
    imageUrl: null,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryMeta: { id: 1, key: 'KOREAN', name: '한식' },
    recipeIngredients: [],
  };

  const mockPrismaService = {
    recipe: {
      findUnique: jest.fn().mockResolvedValue(mockRecipe),
      findMany: jest.fn().mockResolvedValue([mockRecipe]),
      count: jest.fn().mockResolvedValue(1),
    },
    recipeStats: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ recipeId: 1, viewCount: 7, likeCount: 3 }]),
    },
    $queryRaw: jest.fn(),
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
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a recipe by id (published only)', async () => {
      const result = await repository.findById(1);
      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 1, isPublished: true },
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
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          viewCount: 7,
          likeCount: 3,
        }),
      );
    });

    it('통계가 누락되면 Error를 던진다', async () => {
      mockPrismaService.recipeStats.findMany.mockResolvedValueOnce([]);

      await expect(repository.findById(1)).rejects.toThrow(
        'RecipeStats not found for recipeId=1',
      );
    });
  });

  // create, createWithIngredients는 producer에서 제거됨 (Command는 consumer에서 이벤트로 처리)

  describe('findManyPaginated', () => {
    it('cookTime 일반 정렬에서도 2차 정렬로 stats.viewCount를 사용한다', async () => {
      await repository.findManyPaginated({
        page: 1,
        size: 20,
        sort: 'cookTime',
      });

      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
          skip: 0,
          take: 20,
          orderBy: [
            { cookTime: 'asc' },
            { stats: { viewCount: 'desc' } },
            { stats: { likeCount: 'desc' } },
            { id: 'desc' },
          ],
        }),
      );
    });
  });

  describe('searchRecipes', () => {
    it('should search recipes', async () => {
      const params = { difficulty: 3, take: 10 };
      const result = await repository.searchRecipes(params as any);
      expect(prisma.recipe.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockRecipe]);
    });
  });

  describe('findPublishedIdsByPopularity', () => {
    it('공개 레시피 ID를 조회수+좋아요 합산 인기순으로 반환한다', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { id: 3 },
        { id: 1 },
        { id: 2 },
      ]);

      const result = await repository.findPublishedIdsByPopularity({ size: 3 });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([3, 1, 2]);
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

    it('viewCount 정렬 시 일반 조회와 동일한 findMany orderBy를 사용한다', async () => {
      await repository.searchByKeyword({
        page: 1,
        size: 20,
        sort: 'viewCount',
      });

      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { stats: { viewCount: 'desc' } },
            { stats: { likeCount: 'desc' } },
            { id: 'desc' },
          ],
          skip: 0,
          take: 20,
          where: { isPublished: true },
        }),
      );
    });

    it('키워드 검색 시 제목·설명·조리방법을 OR 조건으로 조회한다', async () => {
      await repository.searchByKeyword({
        keyword: '볶기',
        page: 1,
        size: 20,
        sort: 'latest',
      });

      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPublished: true,
            AND: [
              {
                OR: [
                  { title: { contains: '볶기', mode: 'insensitive' } },
                  { description: { contains: '볶기', mode: 'insensitive' } },
                  { cookingMethod: { contains: '볶기', mode: 'insensitive' } },
                ],
              },
            ],
          },
        }),
      );
    });
  });
});
