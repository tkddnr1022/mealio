import { Test, TestingModule } from '@nestjs/testing';
import { PersistService } from 'src/jobs/recipe-ingestion-persist/services/persist.service';
import { PersistRecipeHandler } from '../../handlers/PersistRecipeHandler';

describe('PersistRecipeHandler', () => {
  let handler: PersistRecipeHandler;
  let persistService: jest.Mocked<Pick<PersistService, 'persist'>>;

  beforeEach(async () => {
    persistService = {
      persist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistRecipeHandler,
        { provide: PersistService, useValue: persistService },
      ],
    }).compile();

    handler = module.get(PersistRecipeHandler);
  });

  it('should delegate source range payload to PersistService', async () => {
    await handler.execute({
      startSourceId: 10,
      endSourceId: 20,
      fetchedCount: 8,
      triggeredAt: new Date().toISOString(),
    });
    expect(persistService.persist).toHaveBeenCalledWith({
      startSourceId: 10,
      endSourceId: 20,
      persistBatchSize: 8,
    });
  });
});
