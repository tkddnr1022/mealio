import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../inventory.service';
import { InventoryRepository } from '../../../../infrastructure/database/repositories/mongodb/inventory.repository';
import { IngredientRepository } from '../../../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { InventoryCacheStrategy } from '../../../../infrastructure/cache/strategies/inventory-cache-strategy';
import {
  CACHE_KEY_PREFIX,
  KAFKA_TOPICS,
  InventoryEventType,
  buildCacheKey,
} from '@cook/shared';
import { OwnedIngredientIdsDto } from '../../dto/owned-ingredient-ids.dto';
import { FavoriteIngredientIdsDto } from '../../dto/favorite-ingredient-ids.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: jest.Mocked<InventoryRepository>;
  let ingredientRepository: jest.Mocked<IngredientRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let kafkaProducerService: jest.Mocked<KafkaProducerService>;
  let cacheService: jest.Mocked<CacheService>;
  let inventoryCacheStrategy: jest.Mocked<InventoryCacheStrategy>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInventoryDoc = {
    userId: 1,
    ingredientsIds: [1, 5, 12],
    favoriteIngredientIds: [3, 5],
    lastSyncedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockInventoryRepo = {
      findByUserId: jest.fn().mockResolvedValue(mockInventoryDoc),
    };

    const mockIngredientRepo = {
      findManyByIds: jest.fn().mockImplementation(async (ids: number[]) => {
        const meta: Record<number, { id: number; name: string; categoryId: number }> =
          {
            1: { id: 1, name: 'A', categoryId: 10 },
            3: { id: 3, name: 'B', categoryId: 20 },
            5: { id: 5, name: 'C', categoryId: 10 },
            12: { id: 12, name: 'D', categoryId: 30 },
          };
        return ids
          .filter((id) => meta[id])
          .map((id) => meta[id]);
      }),
    };

    const mockUserRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    const mockKafkaProducer = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const mockCacheService = {
      getOrSet: jest
        .fn()
        .mockImplementation(
          async (
            _strategy: unknown,
            fallback: () => Promise<unknown>,
            ..._args: (string | number)[]
          ) => fallback(),
        ),
    };

    const mockCacheStrategy = {
      generateKey: jest
        .fn()
        .mockImplementation((...args: (string | number)[]) =>
          buildCacheKey(CACHE_KEY_PREFIX.INVENTORY, ...args),
        ),
      getTtl: jest.fn().mockReturnValue(1800),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: mockInventoryRepo,
        },
        { provide: IngredientRepository, useValue: mockIngredientRepo },
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: InventoryCacheStrategy,
          useValue: mockCacheStrategy,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get<InventoryRepository>(
      InventoryRepository,
    ) as jest.Mocked<InventoryRepository>;
    ingredientRepository = module.get<IngredientRepository>(
      IngredientRepository,
    ) as jest.Mocked<IngredientRepository>;
    userRepository = module.get<UserRepository>(
      UserRepository,
    ) as jest.Mocked<UserRepository>;
    kafkaProducerService = module.get<KafkaProducerService>(
      KafkaProducerService,
    ) as jest.Mocked<KafkaProducerService>;
    cacheService = module.get<CacheService>(
      CacheService,
    ) as jest.Mocked<CacheService>;
    inventoryCacheStrategy = module.get<InventoryCacheStrategy>(
      InventoryCacheStrategy,
    ) as jest.Mocked<InventoryCacheStrategy>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyInventory', () => {
    it('Cache-Aside로 getOrSet을 호출하고 MongoDB 폴백 결과를 반환한다', async () => {
      const result = await service.getMyInventory(1);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        inventoryCacheStrategy,
        expect.any(Function),
        1,
      );
      expect(inventoryRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(ingredientRepository.findManyByIds).toHaveBeenCalledWith([
        1, 5, 12, 3,
      ]);
      expect(result.ownedIngredients).toEqual([
        { id: 1, name: 'A', categoryId: 10 },
        { id: 5, name: 'C', categoryId: 10 },
        { id: 12, name: 'D', categoryId: 30 },
      ]);
      expect(result.favoriteIngredients).toEqual([
        { id: 3, name: 'B', categoryId: 20 },
        { id: 5, name: 'C', categoryId: 10 },
      ]);
    });

    it('문서가 없으면 빈 배열을 반환한다', async () => {
      inventoryRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getMyInventory(1);

      expect(result).toEqual({
        ownedIngredients: [],
        favoriteIngredients: [],
      });
    });
  });

  describe('updateOwnedIngredients', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: OwnedIngredientIdsDto = { ownedIngredientIds: [1, 2, 3] };

      const result = await service.updateOwnedIngredients(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.UPDATE,
          userId: 1,
          ownedIngredientIds: [1, 2, 3],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던지고 이벤트를 발행하지 않는다', async () => {
      userRepository.findById.mockResolvedValue(null);
      const dto: OwnedIngredientIdsDto = { ownedIngredientIds: [1] };

      await expect(service.updateOwnedIngredients(999, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateOwnedIngredients(999, dto)).rejects.toThrow(
        'User not found',
      );
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('addOwnedIngredients', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: OwnedIngredientIdsDto = { ownedIngredientIds: [5, 12] };

      const result = await service.addOwnedIngredients(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.ADD,
          userId: 1,
          ownedIngredientIds: [5, 12],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.addOwnedIngredients(999, { ownedIngredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('removeOwnedIngredient', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행한다', async () => {
      await service.removeOwnedIngredient(1, 5);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.REMOVE,
          userId: 1,
          ingredientId: 5,
        }),
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.removeOwnedIngredient(999, 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateFavoriteIngredients', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: FavoriteIngredientIdsDto = {
        favoriteIngredientIds: [1, 5, 12, 23],
      };

      const result = await service.updateFavoriteIngredients(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.FAVORITES_UPDATE,
          userId: 1,
          favoriteIngredientIds: [1, 5, 12, 23],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateFavoriteIngredients(999, {
          favoriteIngredientIds: [1],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('addFavoriteIngredients', () => {
    it('사용자 존재 여부 확인 후 FAVORITES_ADD 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: FavoriteIngredientIdsDto = { favoriteIngredientIds: [1, 5] };

      const result = await service.addFavoriteIngredients(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.FAVORITES_ADD,
          userId: 1,
          favoriteIngredientIds: [1, 5],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.addFavoriteIngredients(999, { favoriteIngredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('removeFavoriteIngredient', () => {
    it('사용자 존재 여부 확인 후 FAVORITES_REMOVE 이벤트를 발행한다', async () => {
      await service.removeFavoriteIngredient(1, 5);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: InventoryEventType.FAVORITES_REMOVE,
          userId: 1,
          ingredientId: 5,
        }),
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.removeFavoriteIngredient(999, 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });
});
