import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatbotResponseDto } from './dto/chatbot-response.dto';
import { ConversationHistoryDto } from './dto/conversation-history.dto';
import { ConversationListDto } from './dto/conversation-list.dto';
import { ConversationListQueryDto } from './dto/conversation-list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/request.types';

@ApiTags('Chatbot')
@Controller('api/v1/chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '챗봇 대화' })
  @ApiResponse({
    status: 200,
    description: '대화 접수 성공',
    type: ChatbotResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 429, description: '요청 제한 초과' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ): Promise<ChatbotResponseDto> {
    return this.chatbotService.sendMessage(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: '대화 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: ConversationListDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getConversationList(
    @CurrentUser() user: AuthUser,
    @Query() query: ConversationListQueryDto,
  ): Promise<ConversationListDto> {
    const limit = query.limit ?? 20;
    return this.chatbotService.getConversationList(
      user.id,
      limit,
      query.cursor,
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: '대화 히스토리 조회' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: ConversationHistoryDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '대화 없음' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getConversationHistory(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
  ): Promise<ConversationHistoryDto> {
    const history = await this.chatbotService.getConversationHistory(
      user.id,
      conversationId,
    );
    if (!history) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
    return history;
  }
}
