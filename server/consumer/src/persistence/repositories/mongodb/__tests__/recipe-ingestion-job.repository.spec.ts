import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RecipeIngestionJob,
  type RecipeIngestionJobDocument,
} from '@mealio/shared';
import { RecipeIngestionJobRepository } from '../recipe-ingestion-job.repository';

describe('RecipeIngestionJobRepository', () => {
  let repository: RecipeIngestionJobRepository;
  let model: Model<RecipeIngestionJobDocument>;

  const jobId = new Types.ObjectId().toHexString();
  const mockJob = {
    _id: jobId,
    sourceId: 12345,
    status: 'fetched',
    retryCount: 0,
    rawData: { RCP_SEQ: '12345' },
  } as unknown as RecipeIngestionJobDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeIngestionJobRepository,
        {
          provide: getModelToken(RecipeIngestionJob.name),
          useValue: {
            findById: jest.fn(),
            countDocuments: jest.fn(),
            find: jest.fn(),
            findOneAndUpdate: jest.fn(),
            updateMany: jest.fn(),
            distinct: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get(RecipeIngestionJobRepository);
    model = module.get(getModelToken(RecipeIngestionJob.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('upsertFetched', () => {
    it('should upsert by sourceId with fetched status on insert', async () => {
      const exec = jest.fn().mockResolvedValue(mockJob);
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({ exec } as never);

      const result = await repository.upsertFetched(12345, {
        RCP_SEQ: '12345',
      });

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { sourceId: 12345 },
        expect.objectContaining({
          $set: expect.objectContaining({
            rawData: { RCP_SEQ: '12345' },
            fetchedAt: expect.any(Date),
          }),
          $setOnInsert: {
            sourceId: 12345,
            status: 'fetched',
            retryCount: 0,
          },
        }),
        { new: true, upsert: true },
      );
      expect(result).toEqual(mockJob);
    });
  });

  describe('transitionStatus', () => {
    it('should update only when fromStatus matches (optimistic lock)', async () => {
      const exec = jest.fn().mockResolvedValue(mockJob);
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({ exec } as never);

      const result = await repository.transitionStatus(
        jobId,
        'fetched',
        'submitting',
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId, status: 'fetched' },
        { $set: { status: 'submitting' } },
        { new: true },
      );
      expect(result).toEqual(mockJob);
    });

    it('should return null for invalid id', async () => {
      const result = await repository.transitionStatus(
        'invalid-id',
        'fetched',
        'submitting',
      );
      expect(result).toBeNull();
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('transitionManyByBatchId', () => {
    it('should bulk update jobs in a batch', async () => {
      const exec = jest.fn().mockResolvedValue({ modifiedCount: 3 });
      jest.spyOn(model, 'updateMany').mockReturnValue({ exec } as never);

      const count = await repository.transitionManyByBatchId(
        'batch_abc',
        'submitted',
        'retrieving',
      );

      expect(model.updateMany).toHaveBeenCalledWith(
        { batchId: 'batch_abc', status: 'submitted' },
        { $set: { status: 'retrieving' } },
      );
      expect(count).toBe(3);
    });
  });

  describe('findDistinctBatchIdsByStatus', () => {
    it('should query distinct batchId for status', async () => {
      jest
        .spyOn(model, 'distinct')
        .mockResolvedValue(['batch_1', 'batch_2'] as never);

      const result = await repository.findDistinctBatchIdsByStatus('submitted');

      expect(model.distinct).toHaveBeenCalledWith('batchId', {
        status: 'submitted',
        batchId: { $exists: true, $ne: null },
      });
      expect(result).toEqual(['batch_1', 'batch_2']);
    });
  });
});
