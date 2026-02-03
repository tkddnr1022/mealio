import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotLogRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';
import { UserIngredientsModule } from '../user-ingredients/user-ingredients.module';

@Module({
  imports: [AuthModule, KafkaModule, UserIngredientsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotLogRepository],
  exports: [ChatbotService],
})
export class ChatbotModule {}
