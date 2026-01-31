import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipeQueryService } from './recipes.service';
import { RecipeRepository } from '../../infrastructure/database/repositories/postgresql/recipe.repository';

@Module({
  controllers: [RecipesController],
  providers: [RecipeQueryService, RecipeRepository],
  exports: [RecipeQueryService],
})
export class RecipesModule {}
