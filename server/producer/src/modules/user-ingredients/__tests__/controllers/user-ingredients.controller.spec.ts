import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserIngredientsController } from '../../user-ingredients.controller';
import { UserIngredientsService } from '../../user-ingredients.service';
import { UserIngredientListDto } from '../../dto/user-ingredient-list.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../../../auth/types/request.types';

describe('UserIngredientsController', () => {
  let controller: UserIngredientsController;
  let userIngredientsService: jest.Mocked<UserIngredientsService>;

  const mockAuthUser: AuthUser = { id: 1 };

  const mockIngredientList: UserIngredientListDto = {
    ingredientIds: [1, 5, 12],
    favoriteIngredientIds: [3, 5],
  };

  beforeEach(async () => {
    const mockService = {
      getMyIngredients: jest.fn().mockResolvedValue(mockIngredientList),
      update: jest.fn().mockResolvedValue({ success: true }),
      add: jest.fn().mockResolvedValue({ success: true }),
      remove: jest.fn().mockResolvedValue(undefined),
      updateFavorites: jest.fn().mockResolvedValue({ success: true }),
      addFavorites: jest.fn().mockResolvedValue({ success: true }),
      removeFavorite: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserIngredientsController],
      providers: [{ provide: UserIngredientsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserIngredientsController>(
      UserIngredientsController,
    );
    userIngredientsService = module.get<UserIngredientsService>(
      UserIngredientsService,
    ) as jest.Mocked<UserIngredientsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyIngredients', () => {
    it('인증 사용자일 때 재료함을 반환한다', async () => {
      const result = await controller.getMyIngredients(mockAuthUser);

      expect(userIngredientsService.getMyIngredients).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockIngredientList);
    });

    it('재료함이 없으면 빈 배열을 반환한다', async () => {
      userIngredientsService.getMyIngredients.mockResolvedValue({
        ingredientIds: [],
        favoriteIngredientIds: [],
      });

      const result = await controller.getMyIngredients(mockAuthUser);

      expect(result).toEqual({
        ingredientIds: [],
        favoriteIngredientIds: [],
      });
    });
  });

  describe('update', () => {
    it('재료함 전체 교체를 요청하고 { success: true }를 반환한다', async () => {
      const dto = { ingredientIds: [1, 2, 3] };
      const result = await controller.update(mockAuthUser, dto);

      expect(userIngredientsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.update(mockAuthUser, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('add', () => {
    it('재료 추가를 요청하고 { success: true }를 반환한다', async () => {
      const dto = { ingredientIds: [5, 12] };
      const result = await controller.add(mockAuthUser, dto);

      expect(userIngredientsService.add).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.add.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.add(mockAuthUser, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('재료 삭제를 요청하고 완료된다', async () => {
      await controller.remove(mockAuthUser, 5);

      expect(userIngredientsService.remove).toHaveBeenCalledWith(1, 5);
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.remove(mockAuthUser, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateFavorites', () => {
    it('즐겨찾기 설정을 요청하고 { success: true }를 반환한다', async () => {
      const dto = { ingredientIds: [1, 5, 12, 23] };
      const result = await controller.updateFavorites(mockAuthUser, dto);

      expect(userIngredientsService.updateFavorites).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.updateFavorites.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateFavorites(mockAuthUser, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addFavorites', () => {
    it('즐겨찾는 재료 추가를 요청하고 201과 { success: true }를 반환한다', async () => {
      const dto = { ingredientIds: [1, 5] };
      const result = await controller.addFavorites(mockAuthUser, dto);

      expect(userIngredientsService.addFavorites).toHaveBeenCalledWith(
        1,
        dto,
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.addFavorites.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addFavorites(mockAuthUser, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFavorite', () => {
    it('즐겨찾는 재료 삭제를 요청하고 204로 완료된다', async () => {
      await controller.removeFavorite(mockAuthUser, 5);

      expect(userIngredientsService.removeFavorite).toHaveBeenCalledWith(
        1,
        5,
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userIngredientsService.removeFavorite.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.removeFavorite(mockAuthUser, 5),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
