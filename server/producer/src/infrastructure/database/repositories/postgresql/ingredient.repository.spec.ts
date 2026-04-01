import { Test, TestingModule } from '@nestjs/testing';
import { IngredientRepository } from './ingredient.repository';
import { PrismaService } from '@cook/shared';

describe('IngredientRepository', () => {
  let repository: IngredientRepository;
  let prisma: PrismaService;

  const mockIngredient: any = {
    id: 1n,
    name: 'Salt',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    ingredient: {
      findUnique: jest.fn().mockResolvedValue(mockIngredient),
      findFirst: jest.fn().mockResolvedValue(mockIngredient),
      findMany: jest.fn().mockResolvedValue([mockIngredient]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(mockIngredient),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<IngredientRepository>(IngredientRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find an ingredient by id', async () => {
      const result = await repository.findById(1n);
      expect(prisma.ingredient.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(result).toEqual(mockIngredient);
    });
  });

  describe('findByName', () => {
    it('should find an ingredient by name', async () => {
      const result = await repository.findByName('Salt');
      expect(prisma.ingredient.findFirst).toHaveBeenCalledWith({
        where: { name: 'Salt' },
      });
      expect(result).toEqual(mockIngredient);
    });
  });

  describe('searchByKeyword', () => {
    it('should search ingredients by keyword with pagination', async () => {
      const result = await repository.searchByKeyword({
        keyword: 'Sa',
        page: 1,
        size: 10,
      });
      expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sa', mode: 'insensitive' },
        },
        skip: 0,
        take: 10,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      });
      expect(prisma.ingredient.count).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sa', mode: 'insensitive' },
        },
      });
      expect(result).toEqual({ data: [mockIngredient], total: 1 });
    });

    it('should filter by categoryId when provided', async () => {
      await repository.searchByKeyword({
        keyword: 'a',
        categoryId: 3,
        page: 2,
        size: 5,
      });
      expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'a', mode: 'insensitive' },
          categoryId: 3,
        },
        skip: 5,
        take: 5,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      });
    });

    it('should omit name filter when keyword is absent', async () => {
      const result = await repository.searchByKeyword({
        page: 1,
        size: 15,
      });
      expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 15,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      });
      expect(prisma.ingredient.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({ data: [mockIngredient], total: 1 });
    });
  });

  // create는 producer에서 제거됨 (Command는 consumer에서 이벤트로 처리)
});
