import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipesController } from '../../recipes.controller';
import { RecipeQueryService } from '../../recipes.service';
import { RecipeSummaryDto } from '../../dto/recipe-summary.dto';
import { RecipeDetailDto } from '../../dto/recipe-detail.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { OptionalJwtAuthGuard } from '../../../auth/guards/optional-jwt-auth.guard';

describe('RecipesController', () => {
  let controller: RecipesController;
  let recipeQueryService: jest.Mocked<RecipeQueryService>;

  const mockSummary: RecipeSummaryDto = {
    id: 1,
    title: '김치볶음밥',
    description: '간단한 김치볶음밥',
    difficulty: 1,
    cookTime: 15,
    imageUrl: null,
    servings: 2,
    viewCount: 0,
    likeCount: 0,
    isPublished: true,
    createdAt: new Date('2025-01-10T10:30:00.000Z'),
  };

  const mockPagination: PaginationDto = {
    page: 1,
    size: 20,
    total: 1,
    totalPages: 1,
  };

  const mockDetail: RecipeDetailDto = {
    ...mockSummary,
    categoryId: 1,
    categoryName: '한식',
    instructions: [{ step: 1, content: '재료를 준비한다.', imageUrl: null }],
    ingredients: [
      { id: 1, name: '김치', amount: 100, unit: 'g', isOptional: false },
    ],
  };

  const mockCategory = {
    id: 1,
    key: 'KOREAN',
    name: '한식',
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(async () => {
    const mockService = {
      getList: jest.fn().mockResolvedValue({
        data: [mockSummary],
        pagination: mockPagination,
      }),
      getById: jest.fn().mockResolvedValue(mockDetail),
      search: jest.fn().mockResolvedValue({
        data: [mockSummary],
        pagination: mockPagination,
      }),
      getSummariesByIds: jest.fn().mockResolvedValue([mockSummary]),
      getCategories: jest.fn().mockResolvedValue({ data: [mockCategory] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [{ provide: RecipeQueryService, useValue: mockService }],
    })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RecipesController>(RecipesController);
    recipeQueryService = module.get<RecipeQueryService>(
      RecipeQueryService,
    ) as jest.Mocked<RecipeQueryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getList', () => {
    it('쿼리로 레시피 목록과 페이지네이션을 반환한다', async () => {
      const query = { page: 1, size: 20, sort: 'latest' as const };
      const result = await controller.getList(query, undefined);

      expect(recipeQueryService.getList).toHaveBeenCalledWith(
        {
          page: 1,
          size: 20,
          difficulty: undefined,
          cookTimeMin: undefined,
          cookTimeMax: undefined,
          sort: 'latest',
        },
        undefined,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('김치볶음밥');
      expect(result.pagination).toEqual(mockPagination);
    });

    it('difficulty, cookTime range, sort를 전달하면 서비스에 그대로 전달한다', async () => {
      const query = {
        page: 2,
        size: 10,
        difficulty: [1, 2],
        cookTimeMin: 10,
        cookTimeMax: 30,
        sort: 'cookTime' as const,
      };
      await controller.getList(query, undefined);

      expect(recipeQueryService.getList).toHaveBeenCalledWith(
        {
          page: 2,
          size: 10,
          difficulty: [1, 2],
          cookTimeMin: 10,
          cookTimeMax: 30,
          sort: 'cookTime',
        },
        undefined,
      );
    });

    it('cookTimeMin만 전달하면 min 필터만 전달한다', async () => {
      const query = { page: 1, size: 20, cookTimeMin: 12 };
      await controller.getList(query, undefined);

      expect(recipeQueryService.getList).toHaveBeenCalledWith(
        {
          page: 1,
          size: 20,
          difficulty: undefined,
          cookTimeMin: 12,
          cookTimeMax: undefined,
          sort: 'latest',
        },
        undefined,
      );
    });
  });

  describe('search', () => {
    it('키워드로 검색 결과와 페이지네이션을 반환한다', async () => {
      const query = { q: '김치', page: 1, size: 20 };
      const result = await controller.search(query, undefined);

      expect(recipeQueryService.search).toHaveBeenCalledWith(
        {
          q: '김치',
          page: 1,
          size: 20,
          difficulty: undefined,
          cookTimeMin: undefined,
          cookTimeMax: undefined,
          categoryId: undefined,
          sort: 'latest',
        },
        undefined,
        undefined,
      );
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('q 없이 검색할 수 있다', async () => {
      const query = { page: 2, size: 10, sort: 'cookTime' as const };
      await controller.search(query, undefined);

      expect(recipeQueryService.search).toHaveBeenCalledWith(
        {
          q: undefined,
          page: 2,
          size: 10,
          difficulty: undefined,
          cookTimeMin: undefined,
          cookTimeMax: undefined,
          categoryId: undefined,
          sort: 'cookTime',
        },
        undefined,
        undefined,
      );
    });

    it('cookTimeMax만 전달하면 max 필터만 전달한다', async () => {
      const query = { q: '김치', page: 1, size: 20, cookTimeMax: 25 };
      await controller.search(query, undefined);

      expect(recipeQueryService.search).toHaveBeenCalledWith(
        {
          q: '김치',
          page: 1,
          size: 20,
          difficulty: undefined,
          cookTimeMin: undefined,
          cookTimeMax: 25,
          categoryId: undefined,
          sort: 'latest',
        },
        undefined,
        undefined,
      );
    });

    it('사용자 컨텍스트가 있으면 userId를 서비스에 전달한다', async () => {
      const query = { q: '김치', page: 1, size: 20 };

      await controller.search(query, { id: 42 });

      expect(recipeQueryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: '김치',
          page: 1,
          size: 20,
        }),
        undefined,
        42,
      );
    });

    it('요청 컨텍스트가 있으면 userId/ip/userAgent를 함께 전달한다', async () => {
      const query = { q: '김치', page: 1, size: 20 };
      await controller.search(
        query,
        { id: 42 },
        { ip: '127.0.0.1', headers: { 'user-agent': 'jest-agent' } },
      );

      expect(recipeQueryService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: '김치',
          page: 1,
          size: 20,
        }),
        {
          userId: 42,
          ipAddress: '127.0.0.1',
          userAgent: 'jest-agent',
        },
        42,
      );
    });
  });

  describe('getSummaries', () => {
    it('ids로 레시피 요약 목록을 반환한다', async () => {
      const dto = { ids: [1, 2, 3] };
      const result = await controller.getSummaries(dto);

      expect(recipeQueryService.getSummariesByIds).toHaveBeenCalledWith([
        1, 2, 3,
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('김치볶음밥');
    });
  });

  describe('getById', () => {
    it('recipeId로 상세 레시피를 반환한다', async () => {
      const result = await controller.getById(1, undefined);

      expect(recipeQueryService.getById).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockDetail);
      expect(result.instructions).toHaveLength(1);
      expect(result.ingredients).toHaveLength(1);
    });

    it('레시피가 없으면 NotFoundException을 던진다', async () => {
      recipeQueryService.getById.mockRejectedValue(
        new NotFoundException('Recipe not found'),
      );

      await expect(controller.getById(999, undefined)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getById(999, undefined)).rejects.toThrow(
        'Recipe not found',
      );
    });

    it('사용자 컨텍스트가 있으면 userId를 서비스에 전달한다', async () => {
      await controller.getById(1, { id: 7 });

      expect(recipeQueryService.getById).toHaveBeenCalledWith(1, undefined, 7);
    });

    it('요청 컨텍스트가 있으면 userId/ip/userAgent를 함께 전달한다', async () => {
      await controller.getById(
        1,
        { id: 7 },
        { ip: '127.0.0.1', headers: { 'user-agent': 'jest-agent' } },
      );

      expect(recipeQueryService.getById).toHaveBeenCalledWith(
        1,
        {
          userId: 7,
          ipAddress: '127.0.0.1',
          userAgent: 'jest-agent',
        },
        7,
      );
    });
  });

  describe('getCategories', () => {
    it('레시피 카테고리 목록을 조회하고 data 배열을 반환한다', async () => {
      const result = await controller.getCategories();

      expect(recipeQueryService.getCategories).toHaveBeenCalled();
      expect(result.data).toEqual([mockCategory]);
    });
  });
});
