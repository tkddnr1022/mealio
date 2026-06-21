import { Test, TestingModule } from '@nestjs/testing';
import { SubmitService } from 'src/jobs/recipe-ingestion-submit/services/submit.service';
import { SubmitRecipeIngestionHandler } from '../../handlers/SubmitRecipeIngestionHandler';

describe('SubmitRecipeIngestionHandler', () => {
  let handler: SubmitRecipeIngestionHandler;
  let submitService: jest.Mocked<Pick<SubmitService, 'submit'>>;

  beforeEach(async () => {
    submitService = {
      submit: jest
        .fn()
        .mockResolvedValue({ submittedCount: 0, skippedCount: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitRecipeIngestionHandler,
        { provide: SubmitService, useValue: submitService },
      ],
    }).compile();

    handler = module.get(SubmitRecipeIngestionHandler);
  });

  it('should delegate trigger payload to SubmitService.submit', async () => {
    await handler.execute({
      runId: 'run-1',
      fetchedCount: 10,
      triggeredAt: '2026-06-21T00:00:00.000Z',
    });

    expect(submitService.submit).toHaveBeenCalledWith({ runId: 'run-1' });
  });
});
