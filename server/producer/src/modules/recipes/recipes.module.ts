import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipeQueryService } from './recipes.service';
import { RecipeRepository } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [RecipesController],
  providers: [RecipeQueryService, RecipeRepository],
  exports: [RecipeQueryService],
})
export class RecipesModule {}
