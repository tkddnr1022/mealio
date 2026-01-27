import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';

@Module({
  imports: [AuthModule, KafkaModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
