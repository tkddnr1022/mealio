import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  CORRELATION_ID_HEADER,
  getCorrelationId,
  runWithCorrelationId,
} from '@mealio/shared';
import { KafkaProducerService } from '../producer.service';

const mockSend = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.mock('kafkajs', () => ({
  logLevel: { ERROR: 0 },
  Kafka: jest.fn().mockImplementation(() => ({
    producer: () => ({
      connect: mockConnect,
      disconnect: mockDisconnect,
      send: mockSend,
    }),
  })),
}));

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.KAFKA_BROKERS = 'localhost:9092';
    process.env.KAFKA_CLIENT_ID = 'mealio-producer-test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(KafkaProducerService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should attach correlation id header when publishing', async () => {
    await runWithCorrelationId('header-correlation-123', async () => {
      await service.emit('activity-events', { foo: 'bar' });
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'activity-events',
        messages: [
          expect.objectContaining({
            headers: expect.objectContaining({
              [CORRELATION_ID_HEADER]: expect.any(Buffer),
            }),
          }),
        ],
      }),
    );

    const sentHeaders = mockSend.mock.calls[0][0].messages[0].headers;
    expect(sentHeaders[CORRELATION_ID_HEADER].toString('utf8')).toBe(
      'header-correlation-123',
    );
    expect(getCorrelationId()).toBeUndefined();
  });

  it('should use explicit correlation id when provided', async () => {
    await service.emit('user-events', { id: 1 }, 'key-1', 'explicit-id-999');

    const sentHeaders = mockSend.mock.calls[0][0].messages[0].headers;
    expect(sentHeaders[CORRELATION_ID_HEADER].toString('utf8')).toBe(
      'explicit-id-999',
    );
  });
});
