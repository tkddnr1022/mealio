import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotLogRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import { ChatbotConversationRepository } from '../../infrastructure/database/repositories/mongodb/chatbot-conversation.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';

@Module({
  imports: [AuthModule, KafkaModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotLogRepository,
    ChatbotConversationRepository,
    UserRepository,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
