import { Injectable } from '@nestjs/common';
import type { RecipeIngestionPersistToEmbedSubmitPayload } from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { EmbedSubmitService } from 'src/jobs/recipe-ingestion-embed-submit/services/embed-submit.service';

@Injectable()
export class EmbedSubmitRecipeIngestionHandler {
  constructor(private readonly embedSubmitService: EmbedSubmitService) {}

  async execute(
    payload: RecipeIngestionPersistToEmbedSubmitPayload,
  ): Promise<void> {
    await this.embedSubmitService.submit({ runId: payload.runId });
  }
}
