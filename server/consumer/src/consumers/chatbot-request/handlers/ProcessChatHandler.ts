import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import {
  RedisService,
  getChatbotStreamChannel,
  CHATBOT_STREAM_EVENT_TYPES,
  CHATBOT_TOOL_CALL_STATUS,
  type ChatbotStreamEvent,
  type ChatbotStreamToolCallEvent,
} from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import {
  ChatbotLogRepository,
  DEFAULT_RECENT_TURNS_LIMIT,
} from 'src/persistence/repositories/mongodb/chatbot-log.repository';
import { ToolDispatcher, type ToolContext } from '../tools/tool-dispatcher';
import { CHATBOT_TOOLS } from '../tools/chatbot-tools.definition';
import { buildMessagesForGpt } from '../context/conversation.manager';
import type { SearchedRecipe } from './SearchRecipesHandler';
import { ChatbotCreditService } from '../services/chatbot-credit.service';

export interface ProcessChatPayload {
  userId: number;
  message: string;
  conversationId?: string;
  streamChannelId?: string;
}

interface RetrievalMeta {
  candidateCount: number;
  candidateRecipeIds: number[];
  selectedRecipeIds: number[];
  topScores: number[];
}

@Injectable()
export class ProcessChatHandler {
  private readonly logger = new Logger(ProcessChatHandler.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly redis: RedisService,
    private readonly toolDispatcher: ToolDispatcher,
    private readonly chatbotLogRepository: ChatbotLogRepository,
    private readonly chatbotCreditService: ChatbotCreditService,
  ) {}

  async execute(payload: ProcessChatPayload): Promise<
    | {
        fullContent: string;
        suggestedRecipes: SearchedRecipe[];
        usage?: {
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        };
        model?: string;
        retrieval?: RetrievalMeta;
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
      publish({
        type: CHATBOT_STREAM_EVENT_TYPES.ERROR,
        data: { message },
      });
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
    suggestedRecipes: SearchedRecipe[];
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    retrieval?: RetrievalMeta;
  }> {
    const toolContext: ToolContext = {
      userId: payload.userId,
      userMessage: payload.message,
    };

    const previousTurns = await this.chatbotLogRepository.findRecentTurns(
      payload.userId,
      { conversationId: payload.conversationId },
      DEFAULT_RECENT_TURNS_LIMIT,
    );

    let messages: ChatCompletionMessageParam[] = buildMessagesForGpt(
      previousTurns,
      payload.message,
    );
    let fullContent = '';
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let model: string | undefined;
    let retrievalMeta: RetrievalMeta | undefined;

    const publishDoneWithCredits = async () => {
      let isCreditDepleted = false;
      if (payload.streamChannelId) {
        const debit =
          await this.chatbotCreditService.debitForCompletedChatbotTurn({
            userId: payload.userId,
            streamChannelId: payload.streamChannelId,
            usage,
          });
        isCreditDepleted = debit.isCreditDepleted;
      }
      if (channel) {
        const suggestedRecipes = this.resolveSuggestedRecipes(toolContext);
        publish({
          type: CHATBOT_STREAM_EVENT_TYPES.DONE,
          data: {
            conversationId,
            isCreditDepleted,
            suggestedRecipes:
              suggestedRecipes.length > 0
                ? suggestedRecipes.map((r) => ({
                    id: r.id,
                    title: r.title,
                    categoryId: r.categoryId,
                    categoryName: r.categoryName,
                    imageUrl: r.imageUrl,
                    cookTime: r.cookTime,
                    difficulty: r.difficulty,
                  }))
                : undefined,
          },
        });
      }
    };

    const maxToolRounds = 5;
    for (let round = 0; round < maxToolRounds; round++) {
      const stream = await this.openai.createChatCompletionStream(messages, {
        tools: CHATBOT_TOOLS,
      });

      const {
        content: roundContent,
        toolCalls,
        finishReason,
        usage: roundUsage,
        model: roundModel,
      } = await this.consumeStream(stream, (chunk) => {
        if (chunk.content) {
          fullContent += chunk.content;
          publish({
            type: CHATBOT_STREAM_EVENT_TYPES.CHUNK,
            data: chunk.content,
          });
        }
        if (chunk.toolCalls?.length) {
          for (const tc of chunk.toolCalls) {
            publish({
              type: CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL,
              data: {
                functionName: tc.name,
                status: CHATBOT_TOOL_CALL_STATUS.START,
                arguments: tc.arguments,
              } as ChatbotStreamToolCallEvent['data'],
            });
          }
        }
      });

      if (roundUsage) {
        if (!usage) {
          usage = { ...roundUsage };
        } else {
          usage = {
            promptTokens: usage.promptTokens + roundUsage.promptTokens,
            completionTokens:
              usage.completionTokens + roundUsage.completionTokens,
            totalTokens: usage.totalTokens + roundUsage.totalTokens,
          };
        }
      }
      if (roundModel && !model) {
        model = roundModel;
      }

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
            type: CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL,
            data: {
              functionName: tc.name,
              status: CHATBOT_TOOL_CALL_STATUS.COMPLETE,
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
          const candidates = toolContext.candidateRecipes ?? [];
          const selected = toolContext.selectedRecipes ?? [];
          retrievalMeta = {
            candidateCount: candidates.length,
            candidateRecipeIds: candidates.map((item) => item.id),
            selectedRecipeIds: selected.map((item) => item.id),
            topScores: candidates.map((item) => item.finalScore ?? 0).slice(0, 5),
          };
        }
      } else {
        const suggestedRecipes = this.resolveSuggestedRecipes(toolContext);
        const finalRetrieval = this.buildFinalRetrievalMeta(
          retrievalMeta,
          toolContext.candidateRecipes ?? [],
          suggestedRecipes,
        );
        await publishDoneWithCredits();
        return {
          fullContent,
          suggestedRecipes,
          usage,
          model,
          retrieval: finalRetrieval,
        };
      }
    }

    const suggestedRecipes = this.resolveSuggestedRecipes(toolContext);
    const finalRetrieval = this.buildFinalRetrievalMeta(
      retrievalMeta,
      toolContext.candidateRecipes ?? [],
      suggestedRecipes,
    );
    await publishDoneWithCredits();
    return {
      fullContent,
      suggestedRecipes,
      model,
      usage,
      retrieval: finalRetrieval,
    };
  }

  private resolveSuggestedRecipes(toolContext: {
    selectedRecipes?: SearchedRecipe[];
    candidateRecipes?: SearchedRecipe[];
  }): SearchedRecipe[] {
    if (toolContext.selectedRecipes && toolContext.selectedRecipes.length > 0) {
      return toolContext.selectedRecipes;
    }
    const fallbackCandidates = toolContext.candidateRecipes ?? [];
    if (fallbackCandidates.length === 0) {
      return [];
    }
    return fallbackCandidates.slice(0, 3);
  }

  private buildFinalRetrievalMeta(
    retrievalMeta: RetrievalMeta | undefined,
    candidates: SearchedRecipe[],
    suggestedRecipes: SearchedRecipe[],
  ): RetrievalMeta {
    return {
      candidateCount: retrievalMeta?.candidateCount ?? candidates.length,
      candidateRecipeIds:
        retrievalMeta?.candidateRecipeIds ?? candidates.map((item) => item.id),
      selectedRecipeIds: suggestedRecipes.map((item) => item.id),
      topScores:
        retrievalMeta?.topScores ??
        candidates.map((item) => item.finalScore ?? 0).slice(0, 5),
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
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model?: string;
  }> {
    let content = '';
    const toolCallsBuffer = new Map<
      number,
      { id: string; name: string; args: string[] }
    >();
    let finishReason: string | undefined;
    let returnToolCalls:
      | Array<{ id: string; name: string; arguments: string }>
      | undefined;
    let streamUsage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let streamModel: string | undefined;

    for await (const chunk of stream) {
      if (chunk.model) {
        streamModel = chunk.model;
      }
      if (chunk.usage && chunk.usage.prompt_tokens != null) {
        streamUsage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens ?? 0,
          totalTokens:
            chunk.usage.total_tokens ??
            chunk.usage.prompt_tokens + (chunk.usage.completion_tokens ?? 0),
        };
      }
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
          returnToolCalls = Array.from(toolCallsBuffer.entries())
            .sort(([a], [b]) => a - b)
            .map(([, b]) => ({
              id: b.id,
              name: b.name,
              arguments: b.args.join(''),
            }))
            .filter((t) => t.name.length > 0);
          onChunk({ toolCalls: returnToolCalls, finishReason });
        }
      }
    }
    return {
      content,
      toolCalls: returnToolCalls,
      finishReason,
      usage: streamUsage,
      model: streamModel,
    };
  }
}
