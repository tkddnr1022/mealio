import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users.service';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { UpdateNicknameDto } from '../../dto/update-nickname.dto';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { UserCacheStrategy } from '../../../../infrastructure/cache/strategies/user-cache-strategy';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let userCacheStrategy: jest.Mocked<UserCacheStrategy>;
  let kafkaProducerService: jest.Mocked<KafkaProducerService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'id',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockProfile = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    createdAt: mockUser.createdAt,
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      getOrSet: jest
        .fn()
        .mockImplementation(async (strategy, fallback, ...args) => {
          return fallback();
        }),
    };

    const mockCacheStrategy = {
      generateKey: jest
        .fn()
        .mockImplementation((...args) => `user:${args.join(':')}`),
      getTtl: jest.fn().mockReturnValue(1800),
    };

    const mockKafkaProducer = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: UserCacheStrategy, useValue: mockCacheStrategy },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(
      UserRepository,
    ) as jest.Mocked<UserRepository>;
    cacheService = module.get<CacheService>(
      CacheService,
    ) as jest.Mocked<CacheService>;
    userCacheStrategy = module.get<UserCacheStrategy>(
      UserCacheStrategy,
    ) as jest.Mocked<UserCacheStrategy>;
    kafkaProducerService = module.get<KafkaProducerService>(
      KafkaProducerService,
    ) as jest.Mocked<KafkaProducerService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('userId로 조회하여 UserProfileDto를 반환한다', async () => {
      const result = await service.getProfile(1);

      // Cache-Aside 패턴: getOrSet이 호출되어야 함
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        userCacheStrategy,
        expect.any(Function),
        1,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.nickname).toBe('TestUser');
      expect(result.createdAt).toEqual(mockUser.createdAt);
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
      await expect(service.getProfile(999)).rejects.toThrow('User not found');
    });

    it('캐시에서 조회된 경우 DB를 호출하지 않는다', async () => {
      // 캐시에 데이터가 있는 경우
      cacheService.getOrSet.mockResolvedValue(mockProfile);

      const result = await service.getProfile(1);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 갱신하고 { id, nickname }을 반환한다', async () => {
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };

      const result = await service.updateNickname(1, dto);

      // DB에서 사용자 조회 (쓰기 작업은 항상 DB 조회)
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      // Kafka 이벤트 발행 (Consumer에서 캐시 무효화 처리)
      expect(kafkaProducerService.emit).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, nickname: 'NewNick' });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };

      await expect(service.updateNickname(999, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });

    it('이벤트만 발행하고 캐시 무효화는 Consumer에서 처리한다', async () => {
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };

      await service.updateNickname(1, dto);

      // Kafka 이벤트 발행 (Consumer의 cache-invalidation 컨슈머가 캐시 무효화 처리)
      expect(kafkaProducerService.emit).toHaveBeenCalled();
    });
  });
});
