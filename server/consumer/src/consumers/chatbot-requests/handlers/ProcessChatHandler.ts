import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import {
  RedisService,
  getChatbotStreamChannel,
  type ChatbotStreamEvent,
  type ChatbotStreamToolCallEvent,
} from '@cook/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { ToolDispatcher } from '../tools/tool-dispatcher';
import { CHATBOT_TOOLS } from '../tools/chatbot-tools.definition';
import { buildMessagesForGpt } from '../context/conversation.manager';
import type { RecipeSummary } from './SearchRecipesHandler';

export interface ProcessChatPayload {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  streamChannelId?: string;
}

@Injectable()
export class ProcessChatHandler {
  private readonly logger = new Logger(ProcessChatHandler.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly redis: RedisService,
    private readonly toolDispatcher: ToolDispatcher,
  ) {}

  async execute(payload: ProcessChatPayload): Promise<
    | {
        fullContent: string;
        suggestedRecipes: RecipeSummary[];
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
      }
    | { error: string }
  > {
    const { streamChannelId, conversationId = 'unknown' } = payload;

    const channel = streamChannelId
      ? getChatbotStreamChannel(streamChannelId)
      : null;

    const publish = (event: ChatbotStreamEvent) => {
      if (channel) {
        this.redis.getClient().publish(channel, JSON.stringify(event));
      }
    };

    try {
      return await this.runChat(payload, publish, channel, conversationId);
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      this.logger.error('ProcessChat error', err as Error);
      publish({ type: 'error', data: { message } });
      return { error: message };
    }
  }

  private async runChat(
    payload: ProcessChatPayload,
    publish: (event: ChatbotStreamEvent) => void,
    channel: string | null,
    conversationId: string,
  ): Promise<{
    fullContent: string;
    suggestedRecipes: RecipeSummary[];
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const toolContext = { userId: payload.userId };

    let messages: ChatCompletionMessageParam[] = buildMessagesForGpt(
      [],
      payload.message,
    );
    let fullContent = '';
    let lastSuggestedRecipes: RecipeSummary[] = [];
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;

    const maxToolRounds = 5;
    for (let round = 0; round < maxToolRounds; round++) {
      const stream = await this.openai.createChatCompletionStream(messages, {
        tools: CHATBOT_TOOLS,
      });

      const { content: roundContent, toolCalls, finishReason } =
        await this.consumeStream(stream, (chunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
            publish({ type: 'chunk', data: chunk.content });
          }
          if (chunk.toolCalls?.length) {
            for (const tc of chunk.toolCalls) {
              publish({
                type: 'tool_call',
                data: {
                  functionName: tc.name,
                  status: 'start',
                  arguments: tc.arguments,
                } as ChatbotStreamToolCallEvent['data'],
              });
            }
          }
        });

      // fullContent는 이미 onChunk에서 chunk.content로 누적됨. roundContent 중복 누적 제거.

      if (finishReason === 'tool_calls' && toolCalls?.length) {
        const assistantMessage: ChatCompletionMessageParam = {
          role: 'assistant',
          content: roundContent ?? null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        };
        messages.push(assistantMessage);

        for (const tc of toolCalls) {
          publish({
            type: 'tool_call',
            data: {
              functionName: tc.name,
              status: 'complete',
              arguments: tc.arguments,
            } as ChatbotStreamToolCallEvent['data'],
          });

          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await this.toolDispatcher.execute(
            tc.name,
            args,
            toolContext,
          );
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });

          try {
            const parsed = JSON.parse(result) as unknown;
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'id' in parsed[0] && 'title' in parsed[0] && 'matchScore' in parsed[0]) {
              lastSuggestedRecipes = parsed as RecipeSummary[];
            }
          } catch {
            // ignore
          }
        }
      } else {
        if (channel) {
          publish({
            type: 'done',
            data: {
              conversationId,
              suggestedRecipes:
                lastSuggestedRecipes.length > 0
                  ? lastSuggestedRecipes.map((r) => ({
                      id: r.id,
                      title: r.title,
                      matchScore: r.matchScore,
                    }))
                  : undefined,
            },
          });
        }
        return {
          fullContent,
          suggestedRecipes: lastSuggestedRecipes,
          usage,
        };
      }
    }

    if (channel) {
      publish({
        type: 'done',
        data: {
          conversationId,
          suggestedRecipes:
            lastSuggestedRecipes.length > 0
              ? lastSuggestedRecipes.map((r) => ({
                  id: r.id,
                  title: r.title,
                  matchScore: r.matchScore,
                }))
              : undefined,
        },
      });
    }
    return {
      fullContent,
      suggestedRecipes: lastSuggestedRecipes,
      usage,
    };
  }

  private async consumeStream(
    stream: Stream<ChatCompletionChunk>,
    onChunk: (chunk: {
      content?: string;
      toolCalls?: Array<{ id: string; name: string; arguments: string }>;
      finishReason?: string;
    }) => void,
  ): Promise<{
    content: string;
    toolCalls?: Array<{ id: string; name: string; arguments: string }>;
    finishReason?: string;
  }> {
    let content = '';
    /** 스트리밍은 인덱스별로 여러 청크에 나뉘어 옴. id로만 버퍼링하면 id 없는 청크가 ''로 합쳐져 name이 빈 항목이 생김 → index 기준 버퍼링 */
    const toolCallsBuffer = new Map<
      number,
      { id: string; name: string; args: string[] }
    >();
    let finishReason: string | undefined;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;
      if (delta?.content && typeof delta.content === 'string') {
        content += delta.content;
        onChunk({ content: delta.content });
      }
      if (delta?.tool_calls?.length) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0;
          if (!toolCallsBuffer.has(index)) {
            toolCallsBuffer.set(index, {
              id: tc.id ?? '',
              name: tc.function?.name ?? '',
              args: tc.function?.arguments ? [tc.function.arguments] : [],
            });
          } else {
            const buf = toolCallsBuffer.get(index)!;
            if (tc.id) buf.id = tc.id;
            if (tc.function?.name) buf.name = tc.function.name;
            if (tc.function?.arguments) buf.args.push(tc.function.arguments);
          }
        }
      }
      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
        if (toolCallsBuffer.size > 0) {
          const toolCalls = Array.from(toolCallsBuffer.entries())
            .sort(([a], [b]) => a - b)
            .map(([, b]) => ({
              id: b.id,
              name: b.name,
              arguments: b.args.join(''),
            }))
            .filter((t) => t.name.length > 0);
          onChunk({ toolCalls, finishReason });
          return {
            content,
            toolCalls,
            finishReason,
          };
        }
      }
    }
    return { content, finishReason };
  }
}
