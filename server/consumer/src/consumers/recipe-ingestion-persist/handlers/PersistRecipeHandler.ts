import { Injectable } from '@nestjs/common';
import { PersistService } from 'src/jobs/recipe-ingestion-persist/services/persist.service';
import type { RecipeIngestionParseRetrieveToPersistPayload } from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';

/** Kafka recipe-ingestion-parse_retrieved 이벤트 진입점 (핵심 로직은 PersistService에 위임). */
@Injectable()
export class PersistRecipeHandler {
  constructor(private readonly persistService: PersistService) {}

  async execute(
    payload: RecipeIngestionParseRetrieveToPersistPayload,
    correlationId?: string,
  ): Promise<void> {
    await this.persistService.persist({
      runId: payload.runId,
      correlationId,
    });
  }
}
