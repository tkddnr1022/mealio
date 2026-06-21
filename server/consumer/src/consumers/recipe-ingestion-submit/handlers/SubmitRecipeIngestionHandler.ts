import { Injectable } from '@nestjs/common';
import { SubmitService } from 'src/jobs/recipe-ingestion-submit/services/submit.service';
import type { RecipeIngestionFetchCompletedPayload } from 'src/jobs/recipe-ingestion-fetch/services/fetch.service';

/** Kafka recipe-ingestion-fetch-completed 이벤트 진입점 (핵심 로직은 SubmitService에 위임). */
@Injectable()
export class SubmitRecipeIngestionHandler {
  constructor(private readonly submitService: SubmitService) {}

  async execute(_payload: RecipeIngestionFetchCompletedPayload): Promise<void> {
    await this.submitService.submit();
  }
}
