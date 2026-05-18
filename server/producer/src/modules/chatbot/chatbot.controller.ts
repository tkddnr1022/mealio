import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationHistoryDto } from './dto/conversation-history.dto';
import { ConversationListDto } from './dto/conversation-list.dto';
import { ConversationListQueryDto } from './dto/conversation-list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/request.types';
import { CHATBOT_STREAM_EVENT_TYPES } from '@mealio/shared';

/** SSE 이벤트 형식: data: {JSON}\n\n */
function formatSSE(data: string): string {
  return `data: ${data}\n\n`;
}

@ApiTags('Chatbot')
@Controller('api/v1/chatbot')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '챗봇 대화 (SSE 스트리밍)',
    description:
      'AI 챗봇과 대화하여 레시피 추천을 받습니다. 응답은 text/event-stream으로 스트리밍됩니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE 스트림 (Content-Type: text/event-stream)',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          description:
            'data: { type: "chunk"|"done"|"error", data: ... } 형식의 이벤트 스트림',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: '요청 제한 초과',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    await this.chatbotService.streamMessage(user.id, dto, {
      write: (data: string) => {
        res.write(formatSSE(data));
        if (
          typeof (res as unknown as { flush?: () => void }).flush === 'function'
        ) {
          (res as unknown as { flush: () => void }).flush();
        }
      },
      end: () => {
        res.end();
      },
      error: (err: Error) => {
        res.write(
          formatSSE(
            JSON.stringify({
              type: CHATBOT_STREAM_EVENT_TYPES.ERROR,
              data: { message: err.message },
            }),
          ),
        );
        res.end();
      },
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: '대화 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '조회 성공',
    type: ConversationListDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
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
    status: HttpStatus.OK,
    description: '조회 성공',
    type: ConversationHistoryDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대화 없음' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 내부 오류',
  })
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
