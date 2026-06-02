import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from '../../users.controller';
import { UsersService } from '../../users.service';
import { UserProfileDto } from '../../dto/user-profile.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../../../auth/types/request.types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockAuthUser: AuthUser = { id: 1 };

  const mockProfile: UserProfileDto = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    creditBalance: 500,
    creditMonthlyLimit: 1000,
  };

  beforeEach(async () => {
    const mockService = {
      getProfile: jest.fn().mockResolvedValue(mockProfile),
      updateNickname: jest
        .fn()
        .mockResolvedValue({ id: 1, nickname: 'NewNick' }),
      getMyActivities: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('인증 사용자일 때 프로필을 반환한다', async () => {
      const result = await controller.getProfile(mockAuthUser);
      expect(usersService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      usersService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(controller.getProfile(mockAuthUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 수정하고 { id, nickname }을 반환한다', async () => {
      const dto = { nickname: 'NewNick' };
      const result = await controller.updateNickname(mockAuthUser, dto);
      expect(usersService.updateNickname).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, nickname: 'NewNick' });
    });
  });

  describe('getMyActivities', () => {
    it('활동 내역을 반환한다', async () => {
      const query = { limit: 20 };
      const result = await controller.getMyActivities(mockAuthUser, query);
      expect(usersService.getMyActivities).toHaveBeenCalledWith(1, query);
      expect(result).toEqual({ items: [], nextCursor: null });
    });
  });
});
