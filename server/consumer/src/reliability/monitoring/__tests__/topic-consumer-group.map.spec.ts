import { KAFKA_TOPICS } from '@mealio/shared';
import { CONSUMER_GROUPS } from '../../../constants/consumer-groups.constants';
import { getConsumerGroupForTopic } from '../topic-consumer-group.map';

describe('getConsumerGroupForTopic', () => {
  it('should map known topics to consumer groups', () => {
    expect(getConsumerGroupForTopic(KAFKA_TOPICS.USER_EVENTS)).toBe(
      CONSUMER_GROUPS.USER_EVENTS,
    );
    expect(getConsumerGroupForTopic(KAFKA_TOPICS.CHATBOT_REQUESTS)).toBe(
      CONSUMER_GROUPS.CHATBOT,
    );
    expect(
      getConsumerGroupForTopic(KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED),
    ).toBe(CONSUMER_GROUPS.RECIPE_INGESTION_PERSIST);
    expect(
      getConsumerGroupForTopic(
        KAFKA_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED,
      ),
    ).toBe(CONSUMER_GROUPS.RECIPE_INGESTION_PARSE_SUBMIT);
    expect(
      getConsumerGroupForTopic(
        KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED,
      ),
    ).toBe(CONSUMER_GROUPS.RECIPE_INGESTION_EMBED_SUBMIT);
  });

  it('should return unknown for unmapped topics', () => {
    expect(getConsumerGroupForTopic('unknown-topic')).toBe('unknown');
  });
});
