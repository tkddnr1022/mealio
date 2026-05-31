import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RECIPE_INGESTION_STATE_KEY,
  RecipeIngestionState,
  type RecipeIngestionStateDocument,
} from '@mealio/shared';

/**
 * Recipe ingestion API 페이징 커서 singleton 리포지토리
 */
@Injectable()
export class RecipeIngestionStateRepository {
  constructor(
    @InjectModel(RecipeIngestionState.name)
    private readonly stateModel: Model<RecipeIngestionStateDocument>,
  ) {}

  /**
   * lastEndIdx 조회 — 문서 없으면 0
   */
  async getLastEndIdx(): Promise<number> {
    const doc = await this.stateModel
      .findOne({ key: RECIPE_INGESTION_STATE_KEY })
      .select('lastEndIdx')
      .lean()
      .exec();
    return doc?.lastEndIdx ?? 0;
  }

  /**
   * lastEndIdx 저장 (singleton upsert)
   */
  async setLastEndIdx(
    lastEndIdx: number,
  ): Promise<RecipeIngestionStateDocument> {
    return this.stateModel
      .findOneAndUpdate(
        { key: RECIPE_INGESTION_STATE_KEY },
        {
          $set: { lastEndIdx },
          $setOnInsert: { key: RECIPE_INGESTION_STATE_KEY },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<RecipeIngestionStateDocument>;
  }
}
