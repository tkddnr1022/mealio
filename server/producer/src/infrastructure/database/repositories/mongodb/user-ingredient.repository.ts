import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserIngredient,
  UserIngredientDocument,
} from '../../mongoose/schemas/user-ingredient.schema';

@Injectable()
export class UserIngredientRepository {
  constructor(
    @InjectModel(UserIngredient.name)
    private readonly userIngredientModel: Model<UserIngredientDocument>,
  ) {}

  async findByUserId(userId: number): Promise<UserIngredient | null> {
    return this.userIngredientModel.findOne({ userId }).exec();
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
