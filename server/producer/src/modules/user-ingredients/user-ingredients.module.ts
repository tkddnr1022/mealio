import { Module } from '@nestjs/common';
import { UserIngredientsController } from './user-ingredients.controller';
import { UserIngredientsService } from './user-ingredients.service';
import { UserIngredientRepository } from '../../infrastructure/database/repositories/mongodb/user-ingredient.repository';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';

@Module({
  imports: [AuthModule, KafkaModule],
  controllers: [UserIngredientsController],
  providers: [
    UserIngredientsService,
    UserIngredientRepository,
    IngredientRepository,
    UserRepository,
  ],
  exports: [UserIngredientsService],
})
export class UserIngredientsModule {}
