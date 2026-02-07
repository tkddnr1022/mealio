import { Injectable } from '@nestjs/common';
import {
  UserIngredientEventType,
  isUserNicknameUpdateEvent,
  type UserEvent,
  type UserIngredientEvent,
} from '@cook/shared';
import {
  EventLogRepository,
  type CreateEventLogInput,
} from 'src/persistence/repositories/mongodb/event-log.repository';

export type UserEventPayload = UserEvent | UserIngredientEvent;

function toEventLogType(event: UserEventPayload): string {
  if (isUserNicknameUpdateEvent(event as UserEvent)) {
    return 'user.nickname.update';
  }
  switch (event.type) {
    case UserIngredientEventType.ADD:
      return 'ingredient.add';
    case UserIngredientEventType.REMOVE:
      return 'ingredient.remove';
    case UserIngredientEventType.BULK_UPDATE:
      return 'user.ingredient.bulk_update';
    case UserIngredientEventType.FAVORITES_UPDATE:
      return 'user.ingredient.favorites_update';
    default:
      return (event as { type: string }).type;
  }
}

function toEventLogPayload(event: UserEventPayload): Record<string, unknown> {
  if ('nickname' in event) {
    return {
      nickname: event.nickname,
      previousNickname: (event as { previousNickname?: string }).previousNickname,
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
    const userId = event.userId;
    const type = toEventLogType(event);
    const payload = toEventLogPayload(event);

    const input: CreateEventLogInput = {
      type,
      actor: {
        type: 'user',
        userId,
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
