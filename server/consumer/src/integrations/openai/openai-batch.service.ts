import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';

export class OpenAIBatchError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OpenAIBatchError';
  }
}

export interface OpenAIBatchSubmitResult {
  fileId: string;
  batchId: string;
}

/**
 * OpenAI Batch API 연동 — Files 업로드 + Batch Job 생성
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.2
 */
@Injectable()
export class OpenAIBatchService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
  }

  getBatchModel(): string {
    return this.config.getOrThrow<string>('OPENAI_BATCH_MODEL');
  }

  /**
   * JSONL 문자열을 Files API에 업로드하고 Batch Job을 생성한다.
   */
  async submitBatchJsonl(
    jsonlContent: string,
  ): Promise<OpenAIBatchSubmitResult> {
    try {
      const file = await this.client.files.create({
        file: await toFile(
          Buffer.from(jsonlContent, 'utf8'),
          'batch-input.jsonl',
        ),
        purpose: 'batch',
      });

      const batch = await this.client.batches.create({
        input_file_id: file.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
      });

      return {
        fileId: file.id,
        batchId: batch.id,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OpenAI Batch submit failed';
      throw new OpenAIBatchError(message, error);
    }
  }
}
