import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';
import { EventLogRepository } from '../../infrastructure/database/repositories/mongodb/event-log.repository';

@Module({
  imports: [AuthModule, KafkaModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, EventLogRepository],
  exports: [UsersService],
})
export class UsersModule {}
