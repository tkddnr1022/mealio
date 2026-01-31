/**
 * Mongoose(MongoDB) 연결 설정
 * [미구현 - Phase 2·3] optimization/database/mongodb/connection-pool.config.ts 에서
 * 환경별 maxPoolSize/minPoolSize 등 분리 관리 시 이 설정을 참고할 수 있음.
 */
import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URL,
  // 연결 풀 설정
  maxPoolSize: 100,
  minPoolSize: 10,

  // 타임아웃 설정
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // 재연결 설정
  retryWrites: true,
  retryReads: true,

  // 읽기 선호도 (Read Preference)
  readPreference: 'secondaryPreferred', // Secondary 우선 읽기

  // Write Concern (쓰기 안정성)
  w: 1, // 단일 노드 확인 (로그성 데이터)
  journal: true, // 저널링 활성화

  // TODO: 압축
  // compressors: ['snappy', 'zlib'],
};
