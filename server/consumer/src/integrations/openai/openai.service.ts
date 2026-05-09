import { Injectable, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionChunk,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import { OpenAIRateLimiter } from './rate-limiter';

/** 스트리밍 청크 한 조각 (onChunk 인자) */
export interface ChatStreamChunk {
  content?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  finishReason?: string;
}

/** 스트리밍 청크 콜백 */
export type OnChunk = (chunk: ChatStreamChunk) => void;

/** 비스트리밍 채팅 완료 결과 */
export interface ChatCompletionResult {
  content: string | null;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(OpenAIRateLimiter)
    private readonly rateLimiter?: OpenAIRateLimiter,
  ) {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    this.model = this.config.getOrThrow<string>('OPENAI_CHAT_MODEL');
    this.client = new OpenAI({ apiKey });
  }

  /**
   * 비스트리밍 채팅 완료 (레시피 생성 등 JSON 응답용).
   */
  async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: { type: 'json_object' };
    },
  ): Promise<ChatCompletionResult> {
    await this.rateLimiter?.acquire();

    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: this.model,
        messages,
        temperature: options?.temperature ?? 1,
        ...(options?.maxTokens != null && { max_completion_tokens: options.maxTokens }),
        ...(options?.responseFormat && {
          response_format: options.responseFormat,
        }),
      };

    const completion = await this.client.chat.completions.create(body);
    const choice = completion.choices[0];
    const content =
      choice?.message?.content && typeof choice.message.content === 'string'
        ? choice.message.content
        : null;

    return {
      content,
      finishReason: choice?.finish_reason ?? 'unknown',
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * 스트리밍 채팅 완료 (챗봇 Function Calling·스트리밍용).
   * tools 전달 시 Function Calling 사용. onChunk로 델타 콘텐츠·tool_calls 전달.
   */
  async createChatCompletionStream(
    messages: ChatCompletionMessageParam[],
    options?: {
      tools?: ChatCompletionTool[];
      onChunk?: OnChunk;
    },
  ): Promise<Stream<ChatCompletionChunk>> {
    await this.rateLimiter?.acquire();

    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model: this.model,
      messages,
      stream: true,
      store: true,
      stream_options: { include_usage: true },
      ...(options?.tools &&
        options.tools.length > 0 && {
          tools: options.tools,
          tool_choice: 'auto',
        }),
    };

    const stream = await this.client.chat.completions.create(body);

    if (options?.onChunk) {
      this.forwardStreamToCallback(stream, options.onChunk).catch(() => {
        // 소비자에서 에러 처리; 여기서는 무시
      });
    }

    return stream;
  }

  /**
   * 스트림을 순회하며 onChunk 호출 (content delta, tool_calls 수집 후 전달).
   */
  private async forwardStreamToCallback(
    stream: AsyncIterable<ChatCompletionChunk>,
    onChunk: OnChunk,
  ): Promise<void> {
    const toolCallsBuffer = new Map<
      string,
      { id: string; name: string; args: string[] }
    >();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;
      let content: string | undefined;
      let toolCalls: ChatStreamChunk['toolCalls'];
      let finishReason: string | undefined;

      if (delta?.content) {
        content = typeof delta.content === 'string' ? delta.content : undefined;
      }

      if (delta?.tool_calls?.length) {
        for (const tc of delta.tool_calls) {
          const id = tc.id ?? '';
          if (!toolCallsBuffer.has(id)) {
            toolCallsBuffer.set(id, {
              id,
              name: tc.function?.name ?? '',
              args: [],
            });
          }
          const buf = toolCallsBuffer.get(id)!;
          if (tc.function?.arguments) {
            buf.args.push(tc.function.arguments);
          }
        }
      }

      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
        if (toolCallsBuffer.size > 0) {
          toolCalls = Array.from(toolCallsBuffer.values()).map((b) => ({
            id: b.id,
            name: b.name,
            arguments: b.args.join(''),
          }));
          toolCallsBuffer.clear();
        }
      }

      if (content !== undefined || toolCalls !== undefined || finishReason) {
        onChunk({
          ...(content !== undefined && { content }),
          ...(toolCalls !== undefined && { toolCalls }),
          ...(finishReason !== undefined && { finishReason }),
        });
      }
    }
  }

  getModel(): string {
    return this.model;
  }
}
