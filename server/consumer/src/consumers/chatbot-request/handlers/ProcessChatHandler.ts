import { Injectable, Logger } from '@nestjs/common';
import type {
  ResponseInput,
  ResponseStreamEvent,
} from 'openai/resources/responses/responses';
import type { Stream } from 'openai/streaming';
import {
  RedisService,
  getChatbotStreamChannel,
  CHATBOT_STREAM_EVENT_TYPES,
  CHATBOT_TOOL_CALL_STATUS,
  type ChatbotStreamEvent,
  type ChatbotStreamToolCallEvent,
} from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { ChatbotConversationRepository } from 'src/persistence/repositories/mongodb/chatbot-conversation.repository';
import { ToolDispatcher, type ToolContext } from '../tools/tool-dispatcher';
import { CHATBOT_TOOLS } from '../tools/chatbot-tools.definition';
import { CHATBOT_SYSTEM_INSTRUCTIONS } from '../context/conversation.manager';
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

interface StreamToolCall {
  callId: string;
  name: string;
  arguments: string;
}

@Injectable()
export class ProcessChatHandler {
  private readonly logger = new Logger(ProcessChatHandler.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly redis: RedisService,
    private readonly toolDispatcher: ToolDispatcher,
    private readonly chatbotConversationRepository: ChatbotConversationRepository,
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
        void this.redis.getClient().publish(channel, JSON.stringify(event));
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
    };

    let previousResponseId =
      await this.chatbotConversationRepository.getLastResponseId(
        payload.userId,
        conversationId,
      );

    let roundInput: string | ResponseInput = [
      { role: 'user', content: payload.message },
    ];
    let fullContent = '';
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let model: string | undefined;
    let retrievalMeta: RetrievalMeta | undefined;
    let finalResponseId: string | undefined;

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
      const stream = await this.openai.createResponseStream(roundInput, {
        instructions: CHATBOT_SYSTEM_INSTRUCTIONS,
        tools: CHATBOT_TOOLS,
        previousResponseId,
      });

      const {
        toolCalls,
        usage: roundUsage,
        model: roundModel,
        responseId,
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
      if (responseId) {
        previousResponseId = responseId;
        finalResponseId = responseId;
      }

      if (toolCalls?.length) {
        const functionCallOutputs: ResponseInput = [];

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
            args = JSON.parse(tc.arguments || '{}') as Record<string, unknown>;
          } catch {
            args = {};
          }
          const result = await this.toolDispatcher.execute(
            tc.name,
            args,
            toolContext,
          );
          functionCallOutputs.push({
            type: 'function_call_output',
            call_id: tc.callId,
            output: result,
          });
          const candidates = toolContext.candidateRecipes ?? [];
          const selected = toolContext.selectedRecipes ?? [];
          retrievalMeta = {
            candidateCount: candidates.length,
            candidateRecipeIds: candidates.map((item) => item.id),
            selectedRecipeIds: selected.map((item) => item.id),
            topScores: candidates
              .map((item) => item.finalScore ?? 0)
              .slice(0, 5),
          };
        }

        roundInput = functionCallOutputs;
      } else {
        if (finalResponseId) {
          await this.chatbotConversationRepository.saveLastResponseId(
            payload.userId,
            conversationId,
            finalResponseId,
          );
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
          usage,
          model,
          retrieval: finalRetrieval,
        };
      }
    }

    if (finalResponseId) {
      await this.chatbotConversationRepository.saveLastResponseId(
        payload.userId,
        conversationId,
        finalResponseId,
      );
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
    stream: Stream<ResponseStreamEvent>,
    onChunk: (chunk: {
      content?: string;
      toolCalls?: StreamToolCall[];
    }) => void,
  ): Promise<{
    content: string;
    toolCalls?: StreamToolCall[];
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model?: string;
    responseId?: string;
  }> {
    let content = '';
    const toolCallsByOutputIndex = new Map<
      number,
      { callId: string; name: string; args: string[] }
    >();
    let streamUsage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let streamModel: string | undefined;
    let responseId: string | undefined;
    let completedToolCalls: StreamToolCall[] | undefined;

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        if (typeof event.delta === 'string' && event.delta.length > 0) {
          content += event.delta;
          onChunk({ content: event.delta });
        }
        continue;
      }

      if (event.type === 'response.output_item.added') {
        const item = event.item;
        if (item.type === 'function_call') {
          toolCallsByOutputIndex.set(event.output_index, {
            callId: item.call_id,
            name: item.name,
            args: item.arguments ? [item.arguments] : [],
          });
          onChunk({
            toolCalls: [
              {
                callId: item.call_id,
                name: item.name,
                arguments: item.arguments ?? '',
              },
            ],
          });
        }
        continue;
      }

      if (event.type === 'response.function_call_arguments.delta') {
        const buf = toolCallsByOutputIndex.get(event.output_index);
        if (buf && typeof event.delta === 'string') {
          buf.args.push(event.delta);
        }
        continue;
      }

      if (event.type === 'response.function_call_arguments.done') {
        const buf = toolCallsByOutputIndex.get(event.output_index);
        if (buf) {
          buf.args = [event.arguments];
        }
        continue;
      }

      if (event.type === 'response.completed') {
        responseId = event.response.id;
        streamModel = event.response.model;
        if (event.response.usage) {
          streamUsage = {
            promptTokens: event.response.usage.input_tokens,
            completionTokens: event.response.usage.output_tokens,
            totalTokens:
              event.response.usage.total_tokens ??
              event.response.usage.input_tokens +
                event.response.usage.output_tokens,
          };
        }

        const fromOutput = (event.response.output ?? [])
          .filter(
            (item): item is Extract<typeof item, { type: 'function_call' }> =>
              item.type === 'function_call',
          )
          .map((item) => ({
            callId: item.call_id,
            name: item.name,
            arguments: item.arguments ?? '',
          }))
          .filter((tc) => tc.name.length > 0);

        if (fromOutput.length > 0) {
          completedToolCalls = fromOutput;
        } else if (toolCallsByOutputIndex.size > 0) {
          completedToolCalls = Array.from(toolCallsByOutputIndex.entries())
            .sort(([a], [b]) => a - b)
            .map(([, b]) => ({
              callId: b.callId,
              name: b.name,
              arguments: b.args.join(''),
            }))
            .filter((t) => t.name.length > 0);
        }
      }
    }

    return {
      content,
      toolCalls: completedToolCalls,
      usage: streamUsage,
      model: streamModel,
      responseId,
    };
  }
}
