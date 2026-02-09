import { Injectable } from '@nestjs/common';
import { type UserEvent, type UserIngredientEvent } from '@cook/shared';
import {
  EventLogRepository,
  type CreateEventLogInput,
} from 'src/persistence/repositories/mongodb/event-log.repository';

export type UserEventPayload = UserEvent | UserIngredientEvent;

function toEventLogPayload(event: UserEventPayload): Record<string, unknown> {
  if ('nickname' in event) {
    return {
      nickname: event.nickname,
      previousNickname: (event as { previousNickname?: string })
        .previousNickname,
    };
  }
  if ('ingredientIds' in event) {
    return { ingredientIds: event.ingredientIds };
  }
  if ('ingredientId' in event) {
    return { ingredientId: event.ingredientId };
  }
  return {};
}

/**
 * 유저 이벤트 수신 시 EventLog 저장 (MongoDB)
 */
@Injectable()
export class TrackUserActivityHandler {
  constructor(private readonly eventLogRepository: EventLogRepository) {}

  async execute(event: UserEventPayload): Promise<void> {
    const payload = toEventLogPayload(event);

    const input: CreateEventLogInput = {
      type: event.type,
      actor: {
        type: 'user',
        userId: event.userId,
      },
      entity:
        'ingredientId' in event
          ? { type: 'ingredient', id: event.ingredientId }
          : undefined,
      payload: { ...payload, _eventType: event.type },
    };

    await this.eventLogRepository.create(input);
  }
}
