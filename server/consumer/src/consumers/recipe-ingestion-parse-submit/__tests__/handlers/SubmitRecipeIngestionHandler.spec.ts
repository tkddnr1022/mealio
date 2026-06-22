import { Test, TestingModule } from '@nestjs/testing';
import { ParseSubmitService } from 'src/jobs/recipe-ingestion-parse-submit/services/parse-submit.service';
import { ParseSubmitRecipeIngestionHandler } from '../../handlers/ParseSubmitRecipeIngestionHandler';

describe('ParseSubmitRecipeIngestionHandler', () => {
  let handler: ParseSubmitRecipeIngestionHandler;
  let parseSubmitService: jest.Mocked<Pick<ParseSubmitService, 'submit'>>;

  beforeEach(async () => {
    parseSubmitService = {
      submit: jest
        .fn()
        .mockResolvedValue({ submittedCount: 0, skippedCount: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseSubmitRecipeIngestionHandler,
        { provide: ParseSubmitService, useValue: parseSubmitService },
      ],
    }).compile();

    handler = module.get(ParseSubmitRecipeIngestionHandler);
  });

  it('should delegate trigger payload to ParseSubmitService.submit', async () => {
    await handler.execute({
      runId: 'run-1',
      fetchedCount: 10,
      triggeredAt: '2026-06-21T00:00:00.000Z',
    });

    expect(parseSubmitService.submit).toHaveBeenCalledWith({ runId: 'run-1' });
  });
});
