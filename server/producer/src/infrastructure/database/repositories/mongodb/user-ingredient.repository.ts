import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserIngredient, UserIngredientDocument } from '@cook/shared';

@Injectable()
export class UserIngredientRepository {
  constructor(
    @InjectModel(UserIngredient.name)
    private readonly userIngredientModel: Model<UserIngredientDocument>,
  ) {}

  /**
   * 사용자별 재료함 조회 (읽기 전용: lean + select로 메모리·속도 최적화, 설계 5.3.2)
   */
  async findByUserId(userId: number): Promise<UserIngredient | null> {
    return this.userIngredientModel
      .findOne({ userId })
      .select('userId ingredientsIds favoriteIngredientIds lastSyncedAt')
      .lean()
      .exec();
  }

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async upsert(
  //   userId: number,
  //   data: Partial<UserIngredient>,
  // ): Promise<UserIngredient> {
  //   return this.userIngredientModel
  //     .findOneAndUpdate({ userId }, data, { upsert: true, new: true })
  //     .exec();
  // }
}
