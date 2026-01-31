import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients.controller';
import { IngredientQueryService } from './ingredients.service';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IngredientsController],
  providers: [IngredientQueryService, IngredientRepository],
  exports: [IngredientQueryService],
})
export class IngredientsModule {}
