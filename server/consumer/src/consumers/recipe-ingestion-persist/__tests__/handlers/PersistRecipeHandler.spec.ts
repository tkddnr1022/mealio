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

  it('should delegate runId payload to PersistService', async () => {
    await handler.execute({
      runId: 'run-1',
      fetchedCount: 8,
      triggeredAt: new Date().toISOString(),
    });
    expect(persistService.persist).toHaveBeenCalledWith({
      runId: 'run-1',
    });
  });
});
