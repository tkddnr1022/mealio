import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipeQueryService } from './recipes.service';
import { RecipeRepository } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { InventoryRepository } from '../../infrastructure/database/repositories/mongodb/inventory.repository';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [RecipesController],
  providers: [RecipeQueryService, RecipeRepository, InventoryRepository],
  exports: [RecipeQueryService],
})
export class RecipesModule {}
