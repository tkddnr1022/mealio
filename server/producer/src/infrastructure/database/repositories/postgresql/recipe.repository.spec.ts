import { Test, TestingModule } from '@nestjs/testing';
import { RecipeRepository } from './recipe.repository';
import { PrismaService } from '../../prisma/prisma.service';

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

  const mockTx = {
    recipe: {
      create: jest.fn().mockResolvedValue(mockRecipe),
    },
    recipeIngredient: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockPrismaService = {
    recipe: {
      findUnique: jest.fn().mockResolvedValue(mockRecipe),
      create: jest.fn().mockResolvedValue(mockRecipe),
      findMany: jest.fn().mockResolvedValue([mockRecipe]),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(mockTx)),
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
    it('should find a recipe by id', async () => {
      const result = await repository.findById(1n);
      expect(prisma.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
        include: {
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

  describe('create', () => {
    it('should create a recipe', async () => {
      const createInput: any = {
        title: 'Test Recipe',
        author: { connect: { id: 1n } },
      };
      const result = await repository.create(createInput);
      expect(prisma.recipe.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('createWithIngredients', () => {
    it('should create a recipe with ingredients in a transaction', async () => {
      const recipeData: any = {
        title: 'New Recipe',
        author: { connect: { id: 1n } },
      };
      const ingredients = [{ ingredientId: 1n, amount: 1, unit: 'cup' }];

      const result = await repository.createWithIngredients(
        recipeData,
        ingredients,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockTx.recipe.create).toHaveBeenCalledWith({ data: recipeData });
      expect(mockTx.recipeIngredient.createMany).toHaveBeenCalledWith({
        data: [
          {
            recipeId: mockRecipe.id,
            ingredientId: 1n,
            amount: 1,
            unit: 'cup',
          },
        ],
      });
      expect(result).toEqual(mockRecipe);
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
});
