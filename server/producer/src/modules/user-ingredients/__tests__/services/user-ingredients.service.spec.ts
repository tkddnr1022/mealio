import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserIngredientsService } from '../../user-ingredients.service';
import { UserIngredientRepository } from '../../../../infrastructure/database/repositories/mongodb/user-ingredient.repository';
import { IngredientRepository } from '../../../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { UserIngredientCacheStrategy } from '../../../../infrastructure/cache/strategies/user-ingredient-cache-strategy';
import {
  CACHE_KEY_PREFIX,
  KAFKA_TOPICS,
  UserIngredientEventType,
  buildCacheKey,
} from '@cook/shared';
import { IngredientIdsDto } from '../../dto/ingredient-ids.dto';

describe('UserIngredientsService', () => {
  let service: UserIngredientsService;
  let userIngredientRepository: jest.Mocked<UserIngredientRepository>;
  let ingredientRepository: jest.Mocked<IngredientRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let kafkaProducerService: jest.Mocked<KafkaProducerService>;
  let cacheService: jest.Mocked<CacheService>;
  let userIngredientCacheStrategy: jest.Mocked<UserIngredientCacheStrategy>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserIngredientDoc = {
    userId: 1,
    ingredientsIds: [1, 5, 12],
    favoriteIngredientIds: [3, 5],
    lastSyncedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserIngredientRepo = {
      findByUserId: jest.fn().mockResolvedValue(mockUserIngredientDoc),
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
          buildCacheKey(CACHE_KEY_PREFIX.USER_INGREDIENT, ...args),
        ),
      getTtl: jest.fn().mockReturnValue(1800),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIngredientsService,
        {
          provide: UserIngredientRepository,
          useValue: mockUserIngredientRepo,
        },
        { provide: IngredientRepository, useValue: mockIngredientRepo },
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: UserIngredientCacheStrategy,
          useValue: mockCacheStrategy,
        },
      ],
    }).compile();

    service = module.get<UserIngredientsService>(UserIngredientsService);
    userIngredientRepository = module.get<UserIngredientRepository>(
      UserIngredientRepository,
    ) as jest.Mocked<UserIngredientRepository>;
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
    userIngredientCacheStrategy = module.get<UserIngredientCacheStrategy>(
      UserIngredientCacheStrategy,
    ) as jest.Mocked<UserIngredientCacheStrategy>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyIngredients', () => {
    it('Cache-Aside로 getOrSet을 호출하고 MongoDB 폴백 결과를 반환한다', async () => {
      const result = await service.getMyIngredients(1);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        userIngredientCacheStrategy,
        expect.any(Function),
        1,
      );
      expect(userIngredientRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(ingredientRepository.findManyByIds).toHaveBeenCalledWith([
        1, 5, 12, 3,
      ]);
      expect(result.ingredients).toEqual([
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
      userIngredientRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getMyIngredients(1);

      expect(result).toEqual({
        ingredients: [],
        favoriteIngredients: [],
      });
    });
  });

  describe('update', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: IngredientIdsDto = { ingredientIds: [1, 2, 3] };

      const result = await service.update(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.UPDATE,
          userId: 1,
          ingredientIds: [1, 2, 3],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던지고 이벤트를 발행하지 않는다', async () => {
      userRepository.findById.mockResolvedValue(null);
      const dto: IngredientIdsDto = { ingredientIds: [1] };

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, dto)).rejects.toThrow('User not found');
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: IngredientIdsDto = { ingredientIds: [5, 12] };

      const result = await service.add(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.ADD,
          userId: 1,
          ingredientIds: [5, 12],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.add(999, { ingredientIds: [1] })).rejects.toThrow(
        NotFoundException,
      );
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행한다', async () => {
      await service.remove(1, 5);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.REMOVE,
          userId: 1,
          ingredientId: 5,
        }),
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.remove(999, 5)).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateFavorites', () => {
    it('사용자 존재 여부 확인 후 Kafka 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: IngredientIdsDto = { ingredientIds: [1, 5, 12, 23] };

      const result = await service.updateFavorites(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.FAVORITES_UPDATE,
          userId: 1,
          ingredientIds: [1, 5, 12, 23],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateFavorites(999, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('addFavorites', () => {
    it('사용자 존재 여부 확인 후 FAVORITES_ADD 이벤트를 발행하고 { success: true }를 반환한다', async () => {
      const dto: IngredientIdsDto = { ingredientIds: [1, 5] };

      const result = await service.addFavorites(1, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.FAVORITES_ADD,
          userId: 1,
          ingredientIds: [1, 5],
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.addFavorites(999, { ingredientIds: [1] }),
      ).rejects.toThrow(NotFoundException);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('사용자 존재 여부 확인 후 FAVORITES_REMOVE 이벤트를 발행한다', async () => {
      await service.removeFavorite(1, 5);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_EVENTS,
        expect.objectContaining({
          type: UserIngredientEventType.FAVORITES_REMOVE,
          userId: 1,
          ingredientId: 5,
        }),
      );
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.removeFavorite(999, 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });
});
