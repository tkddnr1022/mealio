/**
 * Mongoose(MongoDB) 연결 설정
 * Producer/Consumer 공용.
 */
import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URL!,
  maxPoolSize: 100,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  readPreference: 'secondaryPreferred',
  w: 1,
  journal: true,
};
