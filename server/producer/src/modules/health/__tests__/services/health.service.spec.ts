import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { PrismaService } from '@cook/shared';
import { HealthService } from '../../health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let mongoConnection: { db: { admin: () => { ping: () => Promise<void> } } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            db: {
              admin: () => ({
                ping: jest.fn(),
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    mongoConnection = module.get(getConnectionToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getLiveness should return ok status', () => {
    const result = service.getLiveness();

    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });

  it('getReadiness should return ok when dependencies are healthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce(undefined);
    jest
      .spyOn(mongoConnection.db.admin(), 'ping')
      .mockResolvedValueOnce(undefined);

    const result = await service.getReadiness();

    expect(result.status).toBe('ok');
    expect(result.details.postgres).toBe('ok');
    expect(result.details.mongodb).toBe('ok');
  });

  it('getReadiness should return degraded when prisma fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    jest
      .spyOn(mongoConnection.db.admin(), 'ping')
      .mockResolvedValueOnce(undefined);

    const result = await service.getReadiness();

    expect(result.status).toBe('degraded');
    expect(result.details.postgres).toBe('degraded');
    expect(result.details.mongodb).toBe('ok');
  });
});

