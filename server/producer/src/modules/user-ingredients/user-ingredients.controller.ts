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
import { UserIngredientsService } from './user-ingredients.service';
import { UserIngredientListDto } from './dto/user-ingredient-list.dto';
import { IngredientIdsDto } from './dto/ingredient-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/request.types';

@ApiTags('UserIngredient')
@Controller('api/v1/users/me/ingredients')
@UseGuards(JwtAuthGuard)
export class UserIngredientsController {
  constructor(
    private readonly userIngredientsService: UserIngredientsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 재료함 조회' })
  @ApiResponse({
    status: 200,
    description: '재료함 조회 성공',
    type: UserIngredientListDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getMyIngredients(
    @CurrentUser() user: AuthUser,
  ): Promise<UserIngredientListDto> {
    return this.userIngredientsService.getMyIngredients(user.id);
  }

  @Put()
  @ApiOperation({ summary: '내 재료함 업데이트 (bulk)' })
  @ApiResponse({
    status: 200,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async bulkUpdate(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.bulkUpdate(user.id, dto);
  }

  @Put('favorites')
  @ApiOperation({ summary: '즐겨찾는 재료 설정' })
  @ApiResponse({
    status: 200,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async updateFavorites(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.updateFavorites(user.id, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '재료 추가' })
  @ApiResponse({
    status: 201,
    description: '재료 추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async add(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.add(user.id, dto);
  }

  @Delete(':ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '재료 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ): Promise<void> {
    await this.userIngredientsService.remove(user.id, ingredientId);
  }
}
