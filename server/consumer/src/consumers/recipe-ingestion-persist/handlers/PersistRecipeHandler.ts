import { Injectable, Logger } from '@nestjs/common';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationTransaction } from 'src/persistence/transactions/recipe-creation.transaction';
import {
  RetrievedDataValidationError,
  validateRetrievedData,
} from '../validators/retrieved-data.validator';

export interface RecipeIngestionRetrievedPayload {
  jobId: string;
}

// TODO: standalone cron-cli 패턴 적용 검토
/**
 * Kafka recipe-ingestion-retrieved 이벤트 persist 오케스트레이션
 */
@Injectable()
export class PersistRecipeHandler {
  private readonly logger = new Logger(PersistRecipeHandler.name);

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly recipeCreationTransaction: RecipeCreationTransaction,
  ) {}

  async execute(payload: RecipeIngestionRetrievedPayload): Promise<void> {
    const { jobId } = payload;

    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      this.logger.warn(`jobId=${jobId} not found — skip`);
      return;
    }

    if (job.status === 'persisted' || job.status === 'persisting') {
      this.logger.debug(`jobId=${jobId} status=${job.status} — skip`);
      return;
    }

    if (job.status !== 'retrieved') {
      this.logger.debug(
        `jobId=${jobId} status=${job.status} — expected retrieved, skip`,
      );
      return;
    }

    const persisting = await this.jobRepository.transitionStatus(
      jobId,
      'retrieved',
      'persisting',
    );
    if (!persisting) {
      this.logger.debug(
        `jobId=${jobId} retrieved→persisting transition lost race — skip`,
      );
      return;
    }

    try {
      const retrievedData = persisting.retrievedData as
        | Record<string, unknown>
        | undefined;
      const data = validateRetrievedData(retrievedData);

      await this.recipeCreationTransaction.execute(persisting, data);

      const now = new Date();
      const persisted = await this.jobRepository.transitionStatus(
        jobId,
        'persisting',
        'persisted',
        { persistedAt: now },
      );

      if (!persisted) {
        this.logger.warn(
          `jobId=${jobId} persist succeeded but persisting→persisted transition failed`,
        );
      }
    } catch (error) {
      const message =
        error instanceof RetrievedDataValidationError || error instanceof Error
          ? error.message
          : 'Persist failed';

      await this.jobRepository.rollbackPersistingJobWithRetry(jobId, message);
      throw error;
    }
  }
}
