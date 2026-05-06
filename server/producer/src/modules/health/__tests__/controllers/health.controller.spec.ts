import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../health.controller';
import {
  HealthService,
  LivenessResponse,
  ReadinessResponse,
} from '../../health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getLiveness: jest.fn(),
            getReadiness: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return liveness from service', async () => {
    const mockResponse: LivenessResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    (healthService.getLiveness as jest.Mock).mockReturnValue(mockResponse);

    const result = await controller.getHealth();

    expect(result).toEqual(mockResponse);
    expect(healthService.getLiveness).toHaveBeenCalled();
  });

  it('should return readiness from service', async () => {
    const mockResponse: ReadinessResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      details: {
        app: 'ok',
        postgres: 'ok',
        mongodb: 'ok',
      },
    };
    (healthService.getReadiness as jest.Mock).mockResolvedValue(mockResponse);

    const result = await controller.getReady();

    expect(result).toEqual(mockResponse);
    expect(healthService.getReadiness).toHaveBeenCalled();
  });
});
