import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
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
    | 'ingestedAt'
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
    const query = this.jobModel.find({ status }).sort({ ingestedAt: 1 });
    if (limit !== undefined) {
      query.limit(limit);
    }
    return query.exec();
  }

  /**
   * sourceId(RCP_SEQ) 기준 upsert — ingest 멱등성
   */
  async upsertIngested(
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
            ingestedAt: now,
          },
          $setOnInsert: {
            sourceId,
            status: 'ingested' as RecipeIngestionJobStatus,
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
