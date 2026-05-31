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

  /**
   * fetch 단계 row 처리 실패 시 retry_count 증가, 상한 초과 시 failed
   */
  async recordFetchFailure(
    sourceId: string,
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
    sourceId: string,
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
}
