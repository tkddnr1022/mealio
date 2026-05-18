import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConversationListQueryDto } from './conversation-list-query.dto';

describe('ConversationListQueryDto', () => {
  it('limit 문자열을 숫자로 변환하고 검증한다', async () => {
    const dto = plainToInstance(ConversationListQueryDto, { limit: '10' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(10);
  });

  it('잘못된 cursor는 검증에 실패한다', async () => {
    const dto = plainToInstance(ConversationListQueryDto, {
      cursor: 'invalid-cursor',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cursor');
  });

  it('복합 cursor는 검증에 통과한다', async () => {
    const dto = plainToInstance(ConversationListQueryDto, {
      cursor: '2025-01-24T00:00:00.000Z::conv_abc1234567890ab',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
