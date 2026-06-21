import { Injectable, Logger } from '@nestjs/common';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationTransaction } from 'src/persistence/transactions/recipe-creation.transaction';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import {
  RetrievedDataValidationError,
  validateRetrievedData,
} from 'src/consumers/recipe-ingestion-persist/validators/retrieved-data.validator';
import { assertRunScopeAndJobIdMutuallyExclusive } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';

export class PersistRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistRunIdError';
  }
}

export class PersistJobIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistJobIdError';
  }
}

export interface PersistOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
}

export interface PersistResult {
  persistedCount: number;
  skippedCount: number;
  failedCount: number;
}

@Injectable()
export class PersistService {
  private readonly logger = new Logger(PersistService.name);

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly recipeCreationTransaction: RecipeCreationTransaction,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async persist(options: PersistOptions = {}): Promise<PersistResult> {
    assertRunScopeAndJobIdMutuallyExclusive(options);
    if (options.jobId) {
      const outcome = await this.persistByJobId(options.jobId);
      return {
        persistedCount: outcome === 'persisted' ? 1 : 0,
        skippedCount: outcome === 'skipped' ? 1 : 0,
        failedCount: 0,
      };
    }

    const candidates = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'retrieved',
      options,
    );
    if (candidates.length === 0) {
      return { persistedCount: 0, skippedCount: 0, failedCount: 0 };
    }

    let persistedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const job of candidates) {
      try {
        const outcome = await this.persistByJobId(String(job._id));
        if (outcome === 'persisted') {
          persistedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        failedCount++;
        this.logger.error(
          `jobId=${String(job._id)} persist failed in batch: ${
            (error as Error).message
          }`,
        );
      }
    }

    return { persistedCount, skippedCount, failedCount };
  }

  async persistByJobId(jobId: string): Promise<'persisted' | 'skipped'> {
    const startedAt = Date.now();

    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      this.logger.warn(`jobId=${jobId} not found — skip`);
      this.metrics.recordIngestionStage('persist', 'skipped');
      return 'skipped';
    }

    if (job.status === 'persisted' || job.status === 'persisting') {
      this.logger.debug(`jobId=${jobId} status=${job.status} — skip`);
      this.metrics.recordIngestionStage('persist', 'skipped');
      return 'skipped';
    }

    if (job.status !== 'retrieved') {
      this.logger.debug(
        `jobId=${jobId} status=${job.status} — expected retrieved, skip`,
      );
      this.metrics.recordIngestionStage('persist', 'skipped');
      return 'skipped';
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
      this.metrics.recordIngestionStage('persist', 'skipped');
      return 'skipped';
    }

    try {
      const data = validateRetrievedData(persisting.retrievedData);
      this.metrics.recordParseConfidence(data.parseConfidence);

      const result = await this.recipeCreationTransaction.execute(
        persisting,
        data,
      );
      for (const method of result.matchMethods) {
        this.metrics.recordIngredientMatchMethod(method);
      }

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
      this.metrics.recordIngestionStage('persist', 'success');
      this.metrics.observeIngestionStageLatency(
        'persist',
        Date.now() - startedAt,
      );
      return 'persisted';
    } catch (error) {
      const message =
        error instanceof RetrievedDataValidationError || error instanceof Error
          ? error.message
          : 'Persist failed';

      await this.jobRepository.rollbackPersistingJobWithRetry(jobId, message);
      this.metrics.recordIngestionStage('persist', 'failed');
      this.metrics.observeIngestionStageLatency(
        'persist',
        Date.now() - startedAt,
      );
      throw error;
    }
  }

}
