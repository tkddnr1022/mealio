import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLogRepository } from './event-log.repository';
import {
  EventLog,
  EventLogDocument,
} from '@cook/shared';

// Mock chainable query
const mockQuery = {
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockModel = jest.fn().mockImplementation((doc) => ({
  ...doc,
  save: jest.fn().mockResolvedValue(doc),
}));
mockModel.find = jest.fn().mockReturnValue(mockQuery);
mockModel.findById = jest.fn().mockReturnValue(mockQuery);

describe('EventLogRepository', () => {
  let repository: EventLogRepository;
  let model: Model<EventLogDocument>;

  const mockEventLog = {
    type: 1,
    actor: { id: 1 },
  } as EventLog;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventLogRepository,
        {
          provide: getModelToken(EventLog.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<EventLogRepository>(EventLogRepository);
    model = module.get<Model<EventLogDocument>>(getModelToken(EventLog.name));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an event log', async () => {
      const createdLog = await repository.create(mockEventLog);
      expect(mockModel).toHaveBeenCalledWith(mockEventLog);
      expect(createdLog).toEqual(mockEventLog);
    });
  });

  describe('findById', () => {
    it('should find and return a log by id', async () => {
      const id = 'some-id';
      mockQuery.exec.mockResolvedValue(mockEventLog);

      const result = await repository.findById(id);

      expect(model.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockEventLog);
    });
  });

  describe('findMany', () => {
    it('should find and return logs', async () => {
      const params = { take: 10, skip: 5, orderBy: { createdAt: 'desc' } };
      mockQuery.exec.mockResolvedValue([mockEventLog]);

      const result = await repository.findMany(params);

      expect(model.find).toHaveBeenCalledWith(expect.any(Object));
      expect(mockQuery.skip).toHaveBeenCalledWith(params.skip);
      expect(mockQuery.limit).toHaveBeenCalledWith(params.take);
      expect(mockQuery.sort).toHaveBeenCalledWith(params.orderBy);
      expect(result).toEqual([mockEventLog]);
    });
  });
});
