import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Req,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RecipeQueryService } from './recipes.service';
import { RecipeSummaryDto } from './dto/recipe-summary.dto';
import { RecipeDetailDto } from './dto/recipe-detail.dto';
import { PaginationDto } from './dto/pagination.dto';
import { RecipeListQueryDto } from './dto/recipe-list-query.dto';
import { RecipeSearchQueryDto } from './dto/recipe-search-query.dto';
import { RecipeIdsDto } from './dto/recipe-ids.dto';
import { RecipeCategoryDto } from './dto/recipe-category.dto';
import { RecipeStaticIdsQueryDto } from './dto/recipe-static-ids-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserOptional } from '../auth/decorators/current-user-optional.decorator';
import type { AuthUser } from '../auth/types/request.types';
import { DEFAULT_RECIPE_SORT } from './policies/recipe-sort.policy';
import { RecommendedRecipesQueryDto } from './dto/recommended-recipes-query.dto';
import { RecommendedRecipeItemDto } from './dto/recommended-recipe-item.dto';

@ApiTags('Recipe')
@Controller('api/v1/recipes')
@UseGuards(OptionalJwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RecipesController {
  constructor(private readonly recipeQueryService: RecipeQueryService) {}

  @Get()
  @ApiOperation({ summary: '레시피 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '레시피 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RecipeSummaryDto' },
        },
        pagination: { $ref: '#/components/schemas/PaginationDto' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getList(
    @Query() query: RecipeListQueryDto,
  ): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const sort = query.sort ?? DEFAULT_RECIPE_SORT;
    return this.recipeQueryService.getList({
      page,
      size,
      difficulty: query.difficulty,
      cookTimeMin: query.cookTimeMin,
      cookTimeMax: query.cookTimeMax,
      sort,
    });
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '개인화 추천 레시피 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '추천 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RecommendedRecipeItemDto' },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getRecommended(
    @CurrentUser() user: AuthUser,
    @Query() query: RecommendedRecipesQueryDto,
  ): Promise<{ data: RecommendedRecipeItemDto[] }> {
    const limit = query.limit ?? 12;
    return this.recipeQueryService.getRecommended(user.id, limit);
  }

  @Get('static-ids')
  @ApiOperation({ summary: '정적 경로 생성용 레시피 ID 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '정적 경로 생성용 ID 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'integer' },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getStaticIds(
    @Query() query: RecipeStaticIdsQueryDto,
  ): Promise<{ data: number[] }> {
    const size = query.size ?? 100;
    return this.recipeQueryService.getStaticIds(size);
  }

  @Post('summaries') // Body 사용을 위해 POST 사용
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '레시피 요약 정보 벌크 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '조회 성공 (요청한 ID 중 존재·공개된 레시피만 반환)',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/RecipeSummaryDto' },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getSummaries(@Body() dto: RecipeIdsDto): Promise<RecipeSummaryDto[]> {
    return this.recipeQueryService.getSummariesByIds(dto.ids);
  }

  @Get('categories')
  @ApiOperation({ summary: '레시피 카테고리 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '레시피 카테고리 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RecipeCategory' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getCategories(): Promise<{ data: RecipeCategoryDto[] }> {
    return this.recipeQueryService.getCategories();
  }

  @Get('search')
  @ApiOperation({ summary: '레시피 검색' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '검색 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RecipeSummaryDto' },
        },
        pagination: { $ref: '#/components/schemas/PaginationDto' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async search(
    @Query() query: RecipeSearchQueryDto,
    @CurrentUserOptional() user?: AuthUser,
    @Req()
    req?: {
      ip?: string;
      headers: { [key: string]: string | string[] | undefined };
    },
  ): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const sort = query.sort ?? DEFAULT_RECIPE_SORT;
    const params = {
      q: query.q,
      page,
      size,
      difficulty: query.difficulty,
      cookTimeMin: query.cookTimeMin,
      cookTimeMax: query.cookTimeMax,
      categoryId: query.categoryId,
      cookingMethod: query.cookingMethod,
      dishType: query.dishType,
      sort,
    };

    if (!req) {
      return this.recipeQueryService.search(params, undefined);
    }

    const ua = req.headers?.['user-agent'];
    const context = {
      userId: user?.id,
      ipAddress: req.ip,
      userAgent: Array.isArray(ua) ? ua[0] : ua,
    };
    return this.recipeQueryService.search(params, context);
  }

  @Get(':recipeId')
  @ApiOperation({ summary: '레시피 상세 조회' })
  @ApiParam({ name: 'recipeId', description: '레시피 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '레시피 상세 조회 성공',
    type: RecipeDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '레시피를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async getById(
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<RecipeDetailDto> {
    return this.recipeQueryService.getById(recipeId);
  }

  @Post(':recipeId/views')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '레시피 조회수 증가 이벤트 기록' })
  @ApiParam({ name: 'recipeId', description: '레시피 ID' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: '조회수 증가 이벤트 수락',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '레시피를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async recordView(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUserOptional() user?: AuthUser,
    @Req()
    req?: {
      ip?: string;
      headers: { [key: string]: string | string[] | undefined };
    },
  ): Promise<void> {
    const ua = req?.headers?.['user-agent'];
    const context = {
      userId: user?.id,
      ipAddress: req?.ip,
      userAgent: Array.isArray(ua) ? ua[0] : ua,
    };
    await this.recipeQueryService.recordRecipeView(recipeId, context);
  }

  @Post(':recipeId/search-clicks')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '검색 결과 클릭 이벤트 기록' })
  @ApiParam({ name: 'recipeId', description: '레시피 ID' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: '검색 클릭 이벤트 수락',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '레시피를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async recordSearchClick(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUserOptional() user?: AuthUser,
    @Req()
    req?: {
      ip?: string;
      headers: { [key: string]: string | string[] | undefined };
    },
  ): Promise<void> {
    const ua = req?.headers?.['user-agent'];
    const context = {
      userId: user?.id,
      ipAddress: req?.ip,
      userAgent: Array.isArray(ua) ? ua[0] : ua,
    };
    await this.recipeQueryService.recordSearchClick(recipeId, context);
  }
}
