import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from '../../infrastructure/database/repositories/mongodb/inventory.repository';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { RecipeRepository } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';

@Module({
  imports: [AuthModule, KafkaModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryRepository,
    IngredientRepository,
    RecipeRepository,
    UserRepository,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
