import { Injectable } from '@nestjs/common';
import { type UserEvent, type InventoryEvent } from '@cook/shared';
import {
  EventLogRepository,
  type CreateEventLogInput,
} from 'src/persistence/repositories/mongodb/event-log.repository';

export type UserEventPayload = UserEvent | InventoryEvent;

function toEventLogPayload(event: UserEventPayload): Record<string, unknown> {
  if ('nickname' in event) {
    return {
      nickname: event.nickname,
      previousNickname: (event as { previousNickname?: string })
        .previousNickname,
    };
  }
  if ('ownedIngredientIds' in event) {
    return { ownedIngredientIds: event.ownedIngredientIds };
  }
  if ('favoriteIngredientIds' in event) {
    return { favoriteIngredientIds: event.favoriteIngredientIds };
  }
  if ('favoriteRecipeIds' in event) {
    return { favoriteRecipeIds: event.favoriteRecipeIds };
  }
  if ('recipeId' in event) {
    return { recipeId: event.recipeId };
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
    const entity =
      'recipeId' in event && typeof event.recipeId === 'number'
        ? { type: 'recipe', id: event.recipeId }
        : 'ingredientId' in event && typeof event.ingredientId === 'number'
          ? { type: 'ingredient', id: event.ingredientId }
          : undefined;

    const input: CreateEventLogInput = {
      type: event.type,
      actor: {
        type: 'user',
        userId: event.userId,
      },
      entity,
      payload: { ...payload, _eventType: event.type },
    };

    await this.eventLogRepository.create(input);
  }
}
