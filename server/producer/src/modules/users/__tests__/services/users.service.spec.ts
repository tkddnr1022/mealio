import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users.service';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { UpdateNicknameDto } from '../../dto/update-nickname.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'id',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ ...mockUser, nickname: 'NewNick' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository) as jest.Mocked<UserRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('userId로 조회하여 UserProfileDto를 반환한다', async () => {
      const result = await service.getProfile(1);
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
  });

  describe('updateNickname', () => {
    it('닉네임을 갱신하고 { id, nickname }을 반환한다', async () => {
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };
      const result = await service.updateNickname(1, dto);
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.update).toHaveBeenCalledWith(1, { nickname: 'NewNick' });
      expect(result).toEqual({ id: 1, nickname: 'NewNick' });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };
      await expect(service.updateNickname(999, dto)).rejects.toThrow(NotFoundException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
