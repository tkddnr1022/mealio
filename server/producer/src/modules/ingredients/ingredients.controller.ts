import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngredientQueryService } from './ingredients.service';
import { IngredientDto } from './dto/ingredient.dto';
import { IngredientCategoryDto } from './dto/ingredient-category.dto';
import { PaginationDto } from './dto/pagination.dto';
import { IngredientListQueryDto } from './dto/ingredient-list-query.dto';
import { IngredientSearchQueryDto } from './dto/ingredient-search-query.dto';

@ApiTags('Ingredient')
@Controller('api/v1/ingredients')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IngredientsController {
  constructor(
    private readonly ingredientQueryService: IngredientQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: '재료 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '재료 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/IngredientDto' },
        },
        pagination: { $ref: '#/components/schemas/PaginationDto' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async getList(
    @Query() query: IngredientListQueryDto,
  ): Promise<{ data: IngredientDto[]; pagination: PaginationDto }> {
    const page = query.page ?? 1;
    const size = query.size ?? 50;
    return this.ingredientQueryService.getList({
      categoryId: query.categoryId,
      page,
      size,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: '재료 카테고리 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '재료 카테고리 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/IngredientCategory' },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async getCategories(): Promise<{ data: IngredientCategoryDto[] }> {
    return this.ingredientQueryService.getCategories();
  }

  @Get('search')
  @ApiOperation({ summary: '재료 검색' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '검색 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/IngredientDto' },
        },
        pagination: { $ref: '#/components/schemas/PaginationDto' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 내부 오류' })
  async search(
    @Query() query: IngredientSearchQueryDto,
  ): Promise<{ data: IngredientDto[]; pagination: PaginationDto }> {
    const page = query.page ?? 1;
    const size = query.size ?? 50;
    return this.ingredientQueryService.search({
      q: query.q,
      categoryId: query.categoryId,
      page,
      size,
    });
  }
}
