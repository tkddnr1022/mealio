import {
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import { parseConversationListCursor } from '../../../infrastructure/database/repositories/mongodb/conversation-list-cursor';

export function IsConversationListCursor(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isConversationListCursor',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') {
            return true;
          }
          if (typeof value !== 'string') {
            return false;
          }
          return parseConversationListCursor(value) !== null;
        },
        defaultMessage() {
          return 'cursor 형식이 올바르지 않습니다.';
        },
      },
    });
  };
}
