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

/** OpenAI Batch Job 상태 */
export type OpenAIBatchStatus =
  | 'validating'
  | 'failed'
  | 'in_progress'
  | 'finalizing'
  | 'completed'
  | 'expired'
  | 'cancelling'
  | 'cancelled';

export interface OpenAIBatchInfo {
  id: string;
  status: OpenAIBatchStatus;
  outputFileId?: string;
  errorFileId?: string;
}

const IN_PROGRESS_BATCH_STATUSES: ReadonlySet<OpenAIBatchStatus> = new Set([
  'validating',
  'in_progress',
  'finalizing',
]);

export function isInProgressBatchStatus(status: OpenAIBatchStatus): boolean {
  return IN_PROGRESS_BATCH_STATUSES.has(status);
}

/**
 * OpenAI Batch API 연동 — Files 업로드 + Batch Job 생성·조회
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.2, §5.3
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

  /** Batch Job 상태 조회 */
  async getBatch(batchId: string): Promise<OpenAIBatchInfo> {
    try {
      const batch = await this.client.batches.retrieve(batchId);
      return {
        id: batch.id,
        status: batch.status as OpenAIBatchStatus,
        outputFileId: batch.output_file_id ?? undefined,
        errorFileId: batch.error_file_id ?? undefined,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OpenAI Batch retrieve failed';
      throw new OpenAIBatchError(message, error);
    }
  }

  /** Batch output JSONL 파일 내용 다운로드 */
  async downloadBatchOutput(outputFileId: string): Promise<string> {
    try {
      const response = await this.client.files.content(outputFileId);
      return await response.text();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'OpenAI Batch output download failed';
      throw new OpenAIBatchError(message, error);
    }
  }
}
