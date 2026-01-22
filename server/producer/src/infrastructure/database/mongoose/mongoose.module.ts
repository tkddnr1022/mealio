
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { mongooseConfig } from './mongoose.config';
import {
  EventLog,
  EventLogSchema,
} from './schemas/event-log.schema';
import {
  ChatbotLog,
  ChatbotLogSchema,
} from './schemas/chatbot-log.schema';
import {
  UserIngredient,
  UserIngredientSchema,
} from './schemas/user-ingredient.schema';

const MONGOOSE_FEATURES = MongooseModule.forFeature([
  { name: EventLog.name, schema: EventLogSchema },
  { name: ChatbotLog.name, schema: ChatbotLogSchema },
  { name: UserIngredient.name, schema: UserIngredientSchema },
]);

@Global()
@Module({
  imports: [MongooseModule.forRootAsync({ useFactory: () => mongooseConfig }), MONGOOSE_FEATURES],
  exports: [MONGOOSE_FEATURES],
})
export class MongooseSchemasModule {}
