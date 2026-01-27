import { Test, TestingModule } from '@nestjs/testing';
import { IngredientRepository } from './ingredient.repository';
import { PrismaService } from '../../prisma/prisma.service';

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

  describe('search', () => {
    it('should search ingredients', async () => {
      const result = await repository.search('Sa', 10);
      expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Sa' } },
        take: 10,
      });
      expect(result).toEqual([mockIngredient]);
    });
  });

  describe('create', () => {
    it('should create an ingredient', async () => {
      const createInput: any = { name: 'Salt' };
      const result = await repository.create(createInput);
      expect(prisma.ingredient.create).toHaveBeenCalledWith({
        data: createInput,
      });
      expect(result).toEqual(mockIngredient);
    });
  });
});
