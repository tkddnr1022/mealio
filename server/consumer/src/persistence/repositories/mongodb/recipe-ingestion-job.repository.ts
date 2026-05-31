import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RecipeIngestionJob,
  type RecipeIngestionJobDocument,
  type RecipeIngestionJobStatus,
} from '@mealio/shared';

export type RecipeIngestionJobStatusUpdate = Partial<
  Pick<
    RecipeIngestionJobDocument,
    | 'batchId'
    | 'retrievedData'
    | 'errorMessage'
    | 'fetchedAt'
    | 'submittedAt'
    | 'retrievedAt'
    | 'persistedAt'
    | 'failedAt'
    | 'retryCount'
    | 'rawData'
  >
>;

/**
 * Recipe ingestion job MongoDB 리포지토리 — 파이프라인 SSOT CRUD·상태 전환
 */
@Injectable()
export class RecipeIngestionJobRepository {
  constructor(
    @InjectModel(RecipeIngestionJob.name)
    private readonly jobModel: Model<RecipeIngestionJobDocument>,
  ) {}

  async findById(id: string): Promise<RecipeIngestionJobDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.jobModel.findById(id).exec();
  }

  async countByStatus(status: RecipeIngestionJobStatus): Promise<number> {
    return this.jobModel.countDocuments({ status }).exec();
  }

  async findByStatus(
    status: RecipeIngestionJobStatus,
    limit?: number,
  ): Promise<RecipeIngestionJobDocument[]> {
    const query = this.jobModel.find({ status }).sort({ fetchedAt: 1 });
    if (limit !== undefined) {
      query.limit(limit);
    }
    return query.exec();
  }

  async findManyByIdsAndStatus(
    ids: string[],
    status: RecipeIngestionJobStatus,
  ): Promise<RecipeIngestionJobDocument[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) {
      return [];
    }
    return this.jobModel
      .find({ _id: { $in: objectIds }, status })
      .sort({ fetchedAt: 1 })
      .exec();
  }

  /**
   * fetch 단계 row 처리 실패 시 retry_count 증가, 상한 초과 시 failed
   */
  async recordFetchFailure(
    sourceId: number,
    errorMessage: string,
  ): Promise<RecipeIngestionJobDocument> {
    const existing = await this.jobModel.findOne({ sourceId }).exec();
    const nextRetryCount = (existing?.retryCount ?? 0) + 1;
    const now = new Date();
    const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;

    return this.jobModel
      .findOneAndUpdate(
        { sourceId },
        {
          $set: {
            retryCount: nextRetryCount,
            errorMessage,
            ...(failed
              ? { status: 'failed' as RecipeIngestionJobStatus, failedAt: now }
              : {}),
          },
          $setOnInsert: {
            sourceId,
            status: failed
              ? ('failed' as RecipeIngestionJobStatus)
              : ('fetched' as RecipeIngestionJobStatus),
          },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<RecipeIngestionJobDocument>;
  }

  /** sourceId(RCP_SEQ) 기준 upsert — fetch 멱등성 */
  async upsertFetched(
    sourceId: number,
    rawData: Record<string, unknown>,
  ): Promise<RecipeIngestionJobDocument> {
    const now = new Date();
    return this.jobModel
      .findOneAndUpdate(
        { sourceId },
        {
          $set: {
            rawData,
            fetchedAt: now,
          },
          $setOnInsert: {
            sourceId,
            status: 'fetched' as RecipeIngestionJobStatus,
            retryCount: 0,
          },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<RecipeIngestionJobDocument>;
  }

  /**
   * fromStatus 일치 시에만 toStatus로 전환 (낙관적 락)
   * @returns 갱신된 문서 또는 조건 불일치 시 null
   */
  async transitionStatus(
    id: string,
    fromStatus: RecipeIngestionJobStatus,
    toStatus: RecipeIngestionJobStatus,
    updates: RecipeIngestionJobStatusUpdate = {},
  ): Promise<RecipeIngestionJobDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.jobModel
      .findOneAndUpdate(
        { _id: id, status: fromStatus },
        {
          $set: {
            status: toStatus,
            ...updates,
          },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * 여러 job id에 대해 일괄 상태 전환
   * @returns modifiedCount
   */
  async transitionManyByIds(
    ids: string[],
    fromStatus: RecipeIngestionJobStatus,
    toStatus: RecipeIngestionJobStatus,
    updates: RecipeIngestionJobStatusUpdate = {},
  ): Promise<number> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) {
      return 0;
    }
    const result = await this.jobModel
      .updateMany(
        { _id: { $in: objectIds }, status: fromStatus },
        {
          $set: {
            status: toStatus,
            ...updates,
          },
        },
      )
      .exec();
    return result.modifiedCount;
  }

  async findDistinctBatchIdsByStatus(
    status: RecipeIngestionJobStatus,
  ): Promise<string[]> {
    return this.jobModel.distinct('batchId', {
      status,
      batchId: { $exists: true, $ne: null },
    });
  }

  async findByBatchId(
    batchId: string,
    status?: RecipeIngestionJobStatus,
  ): Promise<RecipeIngestionJobDocument[]> {
    const filter: { batchId: string; status?: RecipeIngestionJobStatus } = {
      batchId,
    };
    if (status !== undefined) {
      filter.status = status;
    }
    return this.jobModel.find(filter).exec();
  }

  /**
   * batchId 소속 job 일괄 상태 전환
   * @returns modifiedCount
   */
  async transitionManyByBatchId(
    batchId: string,
    fromStatus: RecipeIngestionJobStatus,
    toStatus: RecipeIngestionJobStatus,
    updates: RecipeIngestionJobStatusUpdate = {},
  ): Promise<number> {
    const result = await this.jobModel
      .updateMany(
        { batchId, status: fromStatus },
        {
          $set: {
            status: toStatus,
            ...updates,
          },
        },
      )
      .exec();
    return result.modifiedCount;
  }

  /**
   * submit 실패 시 submitting job을 fetched(또는 retry 상한 시 failed)로 롤백
   * @returns 롤백된 job 수
   */
  async rollbackSubmittingWithRetry(
    ids: string[],
    errorMessage: string,
  ): Promise<number> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) {
      return 0;
    }

    const jobs = await this.jobModel
      .find({ _id: { $in: objectIds }, status: 'submitting' })
      .exec();

    let rolledBack = 0;
    const now = new Date();

    for (const job of jobs) {
      const nextRetryCount = (job.retryCount ?? 0) + 1;
      const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;

      const result = await this.jobModel
        .updateOne(
          { _id: job._id, status: 'submitting' },
          {
            $set: {
              retryCount: nextRetryCount,
              errorMessage,
              status: failed
                ? ('failed' as RecipeIngestionJobStatus)
                : ('fetched' as RecipeIngestionJobStatus),
              ...(failed ? { failedAt: now } : {}),
            },
          },
        )
        .exec();

      if (result.modifiedCount > 0) {
        rolledBack++;
      }
    }

    return rolledBack;
  }

  /**
   * retrieve: batch failed/expired 시 submitted job 재시도 또는 failed 전환
   * @returns 처리된 job 수
   */
  async rollbackSubmittedBatchWithRetry(
    batchId: string,
    errorMessage: string,
  ): Promise<number> {
    const jobs = await this.jobModel
      .find({ batchId, status: 'submitted' })
      .exec();

    let rolledBack = 0;
    const now = new Date();

    for (const job of jobs) {
      const nextRetryCount = (job.retryCount ?? 0) + 1;
      const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;

      const result = await this.jobModel
        .updateOne(
          { _id: job._id, status: 'submitted' },
          {
            $set: {
              retryCount: nextRetryCount,
              errorMessage,
              status: failed
                ? ('failed' as RecipeIngestionJobStatus)
                : ('fetched' as RecipeIngestionJobStatus),
              ...(failed ? { failedAt: now } : {}),
              ...(!failed
                ? {
                    batchId: undefined,
                    submittedAt: undefined,
                  }
                : {}),
            },
          },
        )
        .exec();

      if (result.modifiedCount > 0) {
        rolledBack++;
      }
    }

    return rolledBack;
  }

  /**
   * retrieve: batch output 처리 전체 실패 시 retrieving job 일괄 롤백
   * @returns 처리된 job 수
   */
  async rollbackRetrievingBatchWithRetry(
    batchId: string,
    errorMessage: string,
  ): Promise<number> {
    const jobs = await this.jobModel
      .find({ batchId, status: 'retrieving' })
      .exec();

    let rolledBack = 0;
    const now = new Date();

    for (const job of jobs) {
      const nextRetryCount = (job.retryCount ?? 0) + 1;
      const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;

      const result = await this.jobModel
        .updateOne( // TODO: updateMany 적용 방안 검토
          { _id: job._id, status: 'retrieving' },
          {
            $set: {
              retryCount: nextRetryCount,
              errorMessage,
              status: failed
                ? ('failed' as RecipeIngestionJobStatus)
                : ('fetched' as RecipeIngestionJobStatus),
              ...(failed ? { failedAt: now } : {}),
              ...(!failed
                ? {
                    batchId: undefined,
                    submittedAt: undefined,
                    retrievedData: undefined,
                    retrievedAt: undefined,
                  }
                : {}),
            },
          },
        )
        .exec();

      if (result.modifiedCount > 0) {
        rolledBack++;
      }
    }

    return rolledBack;
  }

  /**
   * retrieve: output 라인 실패 시 retrieving job 재시도 또는 failed 전환
   * @returns 갱신 성공 여부
   */
  async rollbackRetrievingJobWithRetry(
    id: string,
    errorMessage: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const job = await this.jobModel
      .findOne({ _id: id, status: 'retrieving' })
      .exec();
    if (!job) {
      return false;
    }

    const nextRetryCount = (job.retryCount ?? 0) + 1;
    const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;
    const now = new Date();

    const result = await this.jobModel
      .updateOne(
        { _id: id, status: 'retrieving' },
        {
          $set: {
            retryCount: nextRetryCount,
            errorMessage,
            status: failed
              ? ('failed' as RecipeIngestionJobStatus)
              : ('fetched' as RecipeIngestionJobStatus),
            ...(failed ? { failedAt: now } : {}),
            ...(!failed
              ? {
                  batchId: undefined,
                  submittedAt: undefined,
                  retrievedData: undefined,
                  retrievedAt: undefined,
                }
              : {}),
          },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }

  /**
   * persist 실패 시 persisting job을 retrieved(또는 retry 상한 시 failed)로 롤백
   * @returns 갱신 성공 여부
   */
  async rollbackPersistingJobWithRetry(
    id: string,
    errorMessage: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const job = await this.jobModel
      .findOne({ _id: id, status: 'persisting' })
      .exec();
    if (!job) {
      return false;
    }

    const nextRetryCount = (job.retryCount ?? 0) + 1;
    const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;
    const now = new Date();

    const result = await this.jobModel
      .updateOne(
        { _id: id, status: 'persisting' },
        {
          $set: {
            retryCount: nextRetryCount,
            errorMessage,
            status: failed
              ? ('failed' as RecipeIngestionJobStatus)
              : ('retrieved' as RecipeIngestionJobStatus),
            ...(failed ? { failedAt: now } : {}),
          },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }
}
