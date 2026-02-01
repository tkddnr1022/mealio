/**
 * Mongoose(MongoDB) 모듈
 * - 스키마: shared/database/mongoose/schemas/ (Producer/Consumer 공용)
 * - 리포지토리: repositories/mongodb/ (user-ingredient, chatbot-log, event-log)
 *
 * [미구현 - 명세 backend_architecture_spec.md Phase 2·3]
 * - optimization/caching: mongoose-query.cache.ts (Mongoose 쿼리 결과 캐싱)
 * - optimization/database/mongodb: connection-pool.config.ts, query-optimizer/lean-project.helper.ts
 * - monitoring: mongoose-metrics.ts (Mongoose 쿼리/연결 메트릭)
 * - 성능 모니터링: mongoose.plugin() 또는 쿼리 미들웨어로 느린 쿼리 로깅, connection.on('connected'|'disconnected') 모니터링
 */
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  mongooseConfig,
  EventLog,
  EventLogSchema,
  ChatbotLog,
  ChatbotLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';

const MONGOOSE_FEATURES = MongooseModule.forFeature([
  { name: EventLog.name, schema: EventLogSchema },
  { name: ChatbotLog.name, schema: ChatbotLogSchema },
  { name: UserIngredient.name, schema: UserIngredientSchema },
]);

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({ useFactory: () => mongooseConfig }),
    MONGOOSE_FEATURES,
  ],
  exports: [MONGOOSE_FEATURES],
})
export class MongooseSchemasModule {}
