import { SentryService } from '../sentry.service';
import * as sharedSentry from '@mealio/shared';

jest.mock('@mealio/shared', () => {
  const actual = jest.requireActual('@mealio/shared');
  return {
    ...actual,
    captureSentryException: jest.fn(() => 'evt-1'),
    inferFeatureFromKafkaTopic: jest.fn(() => 'chatbot'),
  };
});

describe('SentryService', () => {
  const captureMock = sharedSentry.captureSentryException as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures kafka failures with topic tags', () => {
    const service = new SentryService();
    const eventId = service.captureException(new Error('boom'), {
      correlationId: 'c-1',
      topic: 'chatbot-requests',
      consumerGroup: 'chatbot-group',
      partition: 0,
      offset: '42',
    });

    expect(eventId).toBe('evt-1');
    expect(captureMock).toHaveBeenCalledWith(
      expect.any(Error),
      'consumer',
      expect.objectContaining({
        correlationId: 'c-1',
        topic: 'chatbot-requests',
        consumerGroup: 'chatbot-group',
        feature: 'chatbot',
      }),
    );
  });
});
