import { Injectable } from '@nestjs/common';
import { SubmitService } from 'src/jobs/recipe-ingestion-submit/services/submit.service';
import type { RecipeIngestionFetchCompletedPayload } from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';

/** Kafka recipe-ingestion-fetch-completed 이벤트 진입점 (핵심 로직은 SubmitService에 위임). */
@Injectable()
export class SubmitRecipeIngestionHandler {
  constructor(private readonly submitService: SubmitService) {}

  async execute(payload: RecipeIngestionFetchCompletedPayload): Promise<void> {
    await this.submitService.submit({ runId: payload.runId });
  }
}
