import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryListDto } from './dto/inventory-list.dto';
import { OwnedIngredientIdsDto } from './dto/owned-ingredient-ids.dto';
import { FavoriteIngredientIdsDto } from './dto/favorite-ingredient-ids.dto';
import { FavoriteRecipeIdsDto } from './dto/favorite-recipe-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/request.types';

@ApiTags('Inventory')
@Controller('api/v1/users/me/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: '내 보관함 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '보관함 조회 성공',
    type: InventoryListDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async getMyInventory(
    @CurrentUser() user: AuthUser,
  ): Promise<InventoryListDto> {
    return this.inventoryService.getMyInventory(user.id);
  }

  @Put('ingredients/owned')
  @ApiOperation({ summary: '내 보유 재료 업데이트 (전체 교체)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async updateOwnedIngredients(
    @CurrentUser() user: AuthUser,
    @Body() dto: OwnedIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.inventoryService.updateOwnedIngredients(user.id, dto);
  }

  @Post('ingredients/owned')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '내 보유 재료 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async addOwnedIngredients(
    @CurrentUser() user: AuthUser,
    @Body() dto: OwnedIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.inventoryService.addOwnedIngredients(user.id, dto);
  }

  @Delete('ingredients/owned/:ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 보유 재료 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 없음' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async removeOwnedIngredient(
    @CurrentUser() user: AuthUser,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ): Promise<void> {
    await this.inventoryService.removeOwnedIngredient(user.id, ingredientId);
  }

  @Put('ingredients/favorites')
  @ApiOperation({ summary: '내 관심 재료 업데이트 (전체 교체)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async updateFavoriteIngredients(
    @CurrentUser() user: AuthUser,
    @Body() dto: FavoriteIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.inventoryService.updateFavoriteIngredients(user.id, dto);
  }

  @Post('ingredients/favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '내 관심 재료 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async addFavoriteIngredients(
    @CurrentUser() user: AuthUser,
    @Body() dto: FavoriteIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.inventoryService.addFavoriteIngredients(user.id, dto);
  }

  @Delete('ingredients/favorites/:ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 관심 재료 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 없음' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async removeFavoriteIngredient(
    @CurrentUser() user: AuthUser,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ): Promise<void> {
    await this.inventoryService.removeFavoriteIngredient(user.id, ingredientId);
  }

  @Post('recipes/favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '내 관심 레시피 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async addFavoriteRecipes(
    @CurrentUser() user: AuthUser,
    @Body() dto: FavoriteRecipeIdsDto,
  ): Promise<{ success: boolean }> {
    return this.inventoryService.addFavoriteRecipes(user.id, dto);
  }

  @Delete('recipes/favorites/:recipeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 관심 레시피 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 없음' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async removeFavoriteRecipe(
    @CurrentUser() user: AuthUser,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<void> {
    await this.inventoryService.removeFavoriteRecipe(user.id, recipeId);
  }
}
