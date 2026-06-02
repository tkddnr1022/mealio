import { Test, TestingModule } from '@nestjs/testing';
import { PersistService } from 'src/jobs/recipe-ingestion-persist/services/persist.service';
import { PersistRecipeHandler } from '../../handlers/PersistRecipeHandler';

const JOB_ID = '507f1f77bcf86cd799439011';

describe('PersistRecipeHandler', () => {
  let handler: PersistRecipeHandler;
  let persistService: jest.Mocked<Pick<PersistService, 'persistByJobId'>>;

  beforeEach(async () => {
    persistService = {
      persistByJobId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistRecipeHandler,
        { provide: PersistService, useValue: persistService },
      ],
    }).compile();

    handler = module.get(PersistRecipeHandler);
  });

  it('should delegate payload jobId to PersistService', async () => {
    await handler.execute({ jobId: JOB_ID });
    expect(persistService.persistByJobId).toHaveBeenCalledWith(JOB_ID);
  });
});
