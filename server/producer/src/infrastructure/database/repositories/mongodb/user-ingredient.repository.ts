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

  async upsert(
    userId: number,
    data: Partial<UserIngredient>,
  ): Promise<UserIngredient> {
    return this.userIngredientModel
      .findOneAndUpdate({ userId }, data, { upsert: true, new: true })
      .exec();
  }
}
