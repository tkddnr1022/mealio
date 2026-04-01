import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsController } from '../../ingredients.controller';
import { IngredientQueryService } from '../../ingredients.service';
import { IngredientDto } from '../../dto/ingredient.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

describe('IngredientsController', () => {
  let controller: IngredientsController;
  let ingredientQueryService: jest.Mocked<IngredientQueryService>;

  const mockIngredient: IngredientDto = {
    id: 1,
    name: '양파',
    categoryId: 1,
  };

  const mockPagination: PaginationDto = {
    page: 1,
    size: 50,
    total: 100,
    totalPages: 2,
  };

  const mockCategory = {
    id: 1,
    key: 'VEGETABLE',
    name: '채소',
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(async () => {
    const mockService = {
      getList: jest.fn().mockResolvedValue({
        data: [mockIngredient],
        pagination: mockPagination,
      }),
      getCategories: jest.fn().mockResolvedValue({ data: [mockCategory] }),
      search: jest.fn().mockResolvedValue({
        data: [mockIngredient],
        pagination: mockPagination,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientsController],
      providers: [{ provide: IngredientQueryService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IngredientsController>(IngredientsController);
    ingredientQueryService = module.get<IngredientQueryService>(
      IngredientQueryService,
    ) as jest.Mocked<IngredientQueryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getList', () => {
    it('카테고리·페이지·사이즈로 목록을 조회하고 data와 pagination을 반환한다', async () => {
      const query = { page: 1, size: 50 };
      const result = await controller.getList(query);

      expect(ingredientQueryService.getList).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        size: 50,
      });
      expect(result.data).toEqual([mockIngredient]);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('category가 있으면 카테고리 필터로 조회한다', async () => {
      const query = { category: 2, page: 1, size: 20 };
      await controller.getList(query);

      expect(ingredientQueryService.getList).toHaveBeenCalledWith({
        category: 2,
        page: 1,
        size: 20,
      });
    });
  });

  describe('search', () => {
    it('키워드로 검색하고 data·pagination을 반환한다', async () => {
      const query = { q: '양파' };
      const result = await controller.search(query);

      expect(ingredientQueryService.search).toHaveBeenCalledWith({
        q: '양파',
        categoryId: undefined,
        page: 1,
        size: 50,
      });
      expect(result.data).toEqual([mockIngredient]);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('categoryId·page·size를 서비스에 전달한다', async () => {
      const query = { q: '파', categoryId: 2, page: 2, size: 20 };
      await controller.search(query);

      expect(ingredientQueryService.search).toHaveBeenCalledWith({
        q: '파',
        categoryId: 2,
        page: 2,
        size: 20,
      });
    });

    it('q 없이 호출해도 page·size는 서비스로 전달된다', async () => {
      const query = { page: 2, size: 20 };
      await controller.search(query);

      expect(ingredientQueryService.search).toHaveBeenCalledWith({
        q: undefined,
        categoryId: undefined,
        page: 2,
        size: 20,
      });
    });
  });

  describe('getCategories', () => {
    it('재료 카테고리 목록을 조회하고 data 배열을 반환한다', async () => {
      const result = await controller.getCategories();

      expect(ingredientQueryService.getCategories).toHaveBeenCalled();
      expect(result.data).toEqual([mockCategory]);
    });
  });
});
