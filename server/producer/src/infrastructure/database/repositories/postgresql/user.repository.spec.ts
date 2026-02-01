import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '@cook/shared';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: PrismaService;

  const mockUser: any = {
    id: 1n,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'test1234',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(mockUser),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const result = await repository.findById(1n);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const result = await repository.findByEmail('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByPlatform', () => {
    it('should find a user by platform', async () => {
      const result = await repository.findByPlatform('local', 'test1234');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { platformName: 'local', platformId: 'test1234' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createInput: any = {
        email: 'test@example.com',
        nickname: 'TestUser',
      };
      const result = await repository.create(createInput);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateInput: any = { nickname: 'UpdatedUser' };
      const result = await repository.update(1n, updateInput);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: updateInput,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const result = await repository.delete(1n);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1n } });
      expect(result).toEqual(mockUser);
    });
  });
});
