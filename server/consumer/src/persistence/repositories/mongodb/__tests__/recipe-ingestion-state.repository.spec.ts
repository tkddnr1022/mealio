import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RECIPE_INGESTION_STATE_KEY,
  RecipeIngestionState,
  type RecipeIngestionStateDocument,
} from '@mealio/shared';
import { RecipeIngestionStateRepository } from '../recipe-ingestion-state.repository';

describe('RecipeIngestionStateRepository', () => {
  let repository: RecipeIngestionStateRepository;
  let model: Model<RecipeIngestionStateDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeIngestionStateRepository,
        {
          provide: getModelToken(RecipeIngestionState.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get(RecipeIngestionStateRepository);
    model = module.get(getModelToken(RecipeIngestionState.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getLastEndIdx', () => {
    it('should return 0 when singleton document does not exist', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      const lean = jest.fn().mockReturnValue({ exec });
      jest.spyOn(model, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({ lean }),
      } as never);

      const result = await repository.getLastEndIdx();

      expect(model.findOne).toHaveBeenCalledWith({
        key: RECIPE_INGESTION_STATE_KEY,
      });
      expect(result).toBe(0);
    });

    it('should return stored lastEndIdx', async () => {
      const exec = jest.fn().mockResolvedValue({ lastEndIdx: 500 });
      const lean = jest.fn().mockReturnValue({ exec });
      jest.spyOn(model, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({ lean }),
      } as never);

      const result = await repository.getLastEndIdx();

      expect(result).toBe(500);
    });
  });

  describe('setLastEndIdx', () => {
    it('should upsert singleton cursor document', async () => {
      const mockDoc = {
        key: RECIPE_INGESTION_STATE_KEY,
        lastEndIdx: 100,
      } as RecipeIngestionStateDocument;
      const exec = jest.fn().mockResolvedValue(mockDoc);
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({ exec } as never);

      const result = await repository.setLastEndIdx(100);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { key: RECIPE_INGESTION_STATE_KEY },
        {
          $set: { lastEndIdx: 100 },
          $setOnInsert: { key: RECIPE_INGESTION_STATE_KEY },
        },
        { new: true, upsert: true },
      );
      expect(result).toEqual(mockDoc);
    });
  });
});
