import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryController } from '../../inventory.controller';
import { InventoryService } from '../../inventory.service';
import { InventoryListDto } from '../../dto/inventory-list.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../../../auth/types/request.types';

describe('InventoryController', () => {
  let controller: InventoryController;
  let inventoryService: jest.Mocked<InventoryService>;

  const mockAuthUser: AuthUser = { id: 1 };

  const mockInventoryList: InventoryListDto = {
    ownedIngredients: [
      { id: 1, name: 'A', categoryId: 10, categoryName: '채소' },
      { id: 5, name: 'C', categoryId: 10, categoryName: '채소' },
      { id: 12, name: 'D', categoryId: 30, categoryName: '양념' },
    ],
    favoriteIngredients: [
      { id: 3, name: 'B', categoryId: 20, categoryName: '육류' },
      { id: 5, name: 'C', categoryId: 10, categoryName: '채소' },
    ],
    favoriteRecipes: [
      {
        id: 101,
        title: '김치볶음밥',
        description: '간단하고 맛있는 김치볶음밥',
        difficulty: 1,
        cookTime: 15,
        imageUrl: null,
        servings: 2,
        viewCount: 10,
        likeCount: 3,
        isPublished: true,
        createdAt: new Date('2025-01-10T10:30:00Z'),
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      getMyInventory: jest.fn().mockResolvedValue(mockInventoryList),
      getFavoriteRecipeIds: jest
        .fn()
        .mockResolvedValue({ favoriteRecipeIds: [101] }),
      updateOwnedIngredients: jest.fn().mockResolvedValue({ success: true }),
      addOwnedIngredients: jest.fn().mockResolvedValue({ success: true }),
      removeOwnedIngredient: jest.fn().mockResolvedValue(undefined),
      updateFavoriteIngredients: jest.fn().mockResolvedValue({ success: true }),
      addFavoriteIngredients: jest.fn().mockResolvedValue({ success: true }),
      removeFavoriteIngredient: jest.fn().mockResolvedValue(undefined),
      addFavoriteRecipes: jest.fn().mockResolvedValue({ success: true }),
      removeFavoriteRecipe: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
    inventoryService = module.get<InventoryService>(
      InventoryService,
    ) as jest.Mocked<InventoryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyInventory', () => {
    it('인증 사용자일 때 보관함을 반환한다', async () => {
      const result = await controller.getMyInventory(mockAuthUser);

      expect(inventoryService.getMyInventory).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockInventoryList);
    });

    it('보관함이 없으면 빈 배열을 반환한다', async () => {
      inventoryService.getMyInventory.mockResolvedValue({
        ownedIngredients: [],
        favoriteIngredients: [],
        favoriteRecipes: [],
      });

      const result = await controller.getMyInventory(mockAuthUser);

      expect(result).toEqual({
        ownedIngredients: [],
        favoriteIngredients: [],
        favoriteRecipes: [],
      });
    });
  });

  describe('getFavoriteRecipeIds', () => {
    it('관심 레시피 ID 목록을 반환한다', async () => {
      const result = await controller.getFavoriteRecipeIds(mockAuthUser);

      expect(inventoryService.getFavoriteRecipeIds).toHaveBeenCalledWith(1);
      expect(result).toEqual({ favoriteRecipeIds: [101] });
    });
  });

  describe('updateOwnedIngredients', () => {
    it('보유 재료 전체 교체를 요청하고 { success: true }를 반환한다', async () => {
      const dto = { ownedIngredientIds: [1, 2, 3] };
      const result = await controller.updateOwnedIngredients(mockAuthUser, dto);

      expect(inventoryService.updateOwnedIngredients).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.updateOwnedIngredients.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateOwnedIngredients(mockAuthUser, {
          ownedIngredientIds: [1],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addOwnedIngredients', () => {
    it('보유 재료 추가를 요청하고 { success: true }를 반환한다', async () => {
      const dto = { ownedIngredientIds: [5, 12] };
      const result = await controller.addOwnedIngredients(mockAuthUser, dto);

      expect(inventoryService.addOwnedIngredients).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.addOwnedIngredients.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addOwnedIngredients(mockAuthUser, {
          ownedIngredientIds: [1],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeOwnedIngredient', () => {
    it('보유 재료 삭제를 요청하고 완료된다', async () => {
      await controller.removeOwnedIngredient(mockAuthUser, 5);

      expect(inventoryService.removeOwnedIngredient).toHaveBeenCalledWith(1, 5);
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.removeOwnedIngredient.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.removeOwnedIngredient(mockAuthUser, 5),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFavoriteIngredients', () => {
    it('관심 재료 설정을 요청하고 { success: true }를 반환한다', async () => {
      const dto = { favoriteIngredientIds: [1, 5, 12, 23] };
      const result = await controller.updateFavoriteIngredients(
        mockAuthUser,
        dto,
      );

      expect(inventoryService.updateFavoriteIngredients).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.updateFavoriteIngredients.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateFavoriteIngredients(mockAuthUser, {
          favoriteIngredientIds: [1],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addFavoriteIngredients', () => {
    it('관심 재료 추가를 요청하고 201과 { success: true }를 반환한다', async () => {
      const dto = { favoriteIngredientIds: [1, 5] };
      const result = await controller.addFavoriteIngredients(mockAuthUser, dto);

      expect(inventoryService.addFavoriteIngredients).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.addFavoriteIngredients.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addFavoriteIngredients(mockAuthUser, {
          favoriteIngredientIds: [1],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFavoriteIngredient', () => {
    it('관심 재료 삭제를 요청하고 204로 완료된다', async () => {
      await controller.removeFavoriteIngredient(mockAuthUser, 5);

      expect(inventoryService.removeFavoriteIngredient).toHaveBeenCalledWith(
        1,
        5,
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.removeFavoriteIngredient.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.removeFavoriteIngredient(mockAuthUser, 5),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addFavoriteRecipes', () => {
    it('관심 레시피 추가를 요청하고 201과 { success: true }를 반환한다', async () => {
      const dto = { favoriteRecipeIds: [101, 202] };
      const result = await controller.addFavoriteRecipes(mockAuthUser, dto);

      expect(inventoryService.addFavoriteRecipes).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.addFavoriteRecipes.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addFavoriteRecipes(mockAuthUser, {
          favoriteRecipeIds: [101],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFavoriteRecipe', () => {
    it('관심 레시피 삭제를 요청하고 204로 완료된다', async () => {
      await controller.removeFavoriteRecipe(mockAuthUser, 101);

      expect(inventoryService.removeFavoriteRecipe).toHaveBeenCalledWith(
        1,
        101,
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      inventoryService.removeFavoriteRecipe.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.removeFavoriteRecipe(mockAuthUser, 101),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
