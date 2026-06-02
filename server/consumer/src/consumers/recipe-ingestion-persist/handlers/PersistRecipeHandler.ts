import { Injectable } from '@nestjs/common';
import { PersistService } from 'src/jobs/recipe-ingestion-persist/services/persist.service';

export interface RecipeIngestionRetrievedPayload {
  jobId: string;
}

/** Kafka recipe-ingestion-retrieved 이벤트 진입점 (핵심 로직은 PersistService에 위임). */
@Injectable()
export class PersistRecipeHandler {
  constructor(private readonly persistService: PersistService) {}

  async execute(payload: RecipeIngestionRetrievedPayload): Promise<void> {
    await this.persistService.persistByJobId(payload.jobId);
  }
}
