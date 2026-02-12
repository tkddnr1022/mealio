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
    status: HttpStatus.OK,
    description: '재료함 조회 성공',
    type: UserIngredientListDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async getMyIngredients(
    @CurrentUser() user: AuthUser,
  ): Promise<UserIngredientListDto> {
    return this.userIngredientsService.getMyIngredients(user.id);
  }

  @Put()
  @ApiOperation({ summary: '내 재료함 업데이트' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async update(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.update(user.id, dto);
  }

  @Put('favorites')
  @ApiOperation({ summary: '즐겨찾는 재료 설정 (전체 교체)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '업데이트 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async updateFavorites(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.updateFavorites(user.id, dto);
  }

  @Post('favorites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '즐겨찾는 재료 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async addFavorites(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.addFavorites(user.id, dto);
  }

  @Delete('favorites/:ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '즐겨찾는 재료 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ): Promise<void> {
    await this.userIngredientsService.removeFavorite(user.id, ingredientId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '재료 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '재료 추가 성공',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async add(
    @CurrentUser() user: AuthUser,
    @Body() dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    return this.userIngredientsService.add(user.id, dto);
  }

  @Delete(':ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '재료 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 없음' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ): Promise<void> {
    await this.userIngredientsService.remove(user.id, ingredientId);
  }
}
