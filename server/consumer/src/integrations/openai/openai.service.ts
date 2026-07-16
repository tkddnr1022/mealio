import { Injectable, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ResponseInput,
  ResponseStreamEvent,
  Tool,
} from 'openai/resources/responses/responses';
import type { Stream } from 'openai/streaming';
import { OpenAIRateLimiter } from './rate-limiter';

/** 비스트리밍 Responses 결과 */
export interface ResponseResult {
  content: string | null;
  finishReason: string;
  responseId?: string;
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
  private readonly embeddingModel: string;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(OpenAIRateLimiter)
    private readonly rateLimiter?: OpenAIRateLimiter,
  ) {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    this.model = this.config.getOrThrow<string>('OPENAI_CHAT_MODEL');
    this.embeddingModel = this.config.getOrThrow<string>(
      'OPENAI_EMBEDDING_MODEL',
    );
    this.client = new OpenAI({ apiKey });
  }

  async createEmbedding(input: string): Promise<number[]> {
    const [embedding] = await this.createEmbeddings([input]);
    return embedding ?? [];
  }

  async createEmbeddings(inputs: string[]): Promise<number[][]> {
    const normalized = inputs
      .map((input) => input.trim())
      .filter((input) => input.length > 0);
    if (normalized.length === 0) {
      return [];
    }

    await this.rateLimiter?.acquire();
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: normalized,
    });

    return response.data
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding ?? [])
      .filter((embedding) => embedding.length > 0);
  }

  /**
   * 비스트리밍 Responses 호출 (제목 생성·질의 확장 등 JSON/텍스트 응답용).
   */
  async createResponse(
    input: string | ResponseInput,
    options?: {
      instructions?: string;
      maxOutputTokens?: number;
      responseFormat?: { type: 'json_object' };
      tools?: Tool[];
      previousResponseId?: string;
    },
  ): Promise<ResponseResult> {
    await this.rateLimiter?.acquire();

    const response = await this.client.responses.create({
      model: this.model,
      input,
      store: true,
      ...(options?.instructions != null && {
        instructions: options.instructions,
      }),
      ...(options?.maxOutputTokens != null && {
        max_output_tokens: options.maxOutputTokens,
      }),
      ...(options?.responseFormat && {
        text: { format: options.responseFormat },
      }),
      ...(options?.tools &&
        options.tools.length > 0 && {
          tools: options.tools,
          tool_choice: 'auto' as const,
        }),
      ...(options?.previousResponseId && {
        previous_response_id: options.previousResponseId,
      }),
    });

    const content =
      typeof response.output_text === 'string' &&
      response.output_text.length > 0
        ? response.output_text
        : null;

    return {
      content,
      finishReason: this.mapFinishReason(response),
      responseId: response.id,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens:
              response.usage.total_tokens ??
              response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * 스트리밍 Responses 호출 (챗봇 Function Calling·스트리밍용).
   * tools·previousResponseId·instructions를 전달한다. 이벤트 파싱은 호출측에서 수행한다.
   */
  async createResponseStream(
    input: string | ResponseInput,
    options?: {
      instructions?: string;
      tools?: Tool[];
      previousResponseId?: string;
    },
  ): Promise<Stream<ResponseStreamEvent>> {
    await this.rateLimiter?.acquire();

    return this.client.responses.create({
      model: this.model,
      input,
      stream: true,
      store: true,
      ...(options?.instructions != null && {
        instructions: options.instructions,
      }),
      ...(options?.tools &&
        options.tools.length > 0 && {
          tools: options.tools,
          tool_choice: 'auto' as const,
        }),
      ...(options?.previousResponseId && {
        previous_response_id: options.previousResponseId,
      }),
    });
  }

  private mapFinishReason(response: {
    status?: string | null;
    incomplete_details?: { reason?: string | null } | null;
  }): string {
    if (response.status === 'completed') {
      return 'completed';
    }
    if (response.status === 'incomplete') {
      if (response.incomplete_details?.reason === 'max_output_tokens') {
        return 'length';
      }
      return response.incomplete_details?.reason ?? 'incomplete';
    }
    if (response.status === 'failed') {
      return 'failed';
    }
    return response.status ?? 'unknown';
  }

  getModel(): string {
    return this.model;
  }

  getEmbeddingModel(): string {
    return this.embeddingModel;
  }
}
