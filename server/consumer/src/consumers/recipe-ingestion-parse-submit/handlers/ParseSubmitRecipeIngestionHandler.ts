import { Injectable } from '@nestjs/common';
import type { RecipeIngestionFetchToParseSubmitPayload } from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { ParseSubmitService } from 'src/jobs/recipe-ingestion-parse-submit/services/parse-submit.service';

@Injectable()
export class ParseSubmitRecipeIngestionHandler {
  constructor(private readonly parseSubmitService: ParseSubmitService) {}

  async execute(
    payload: RecipeIngestionFetchToParseSubmitPayload,
    correlationId?: string,
  ): Promise<void> {
    await this.parseSubmitService.submit({
      runId: payload.runId,
      correlationId,
    });
  }
}
