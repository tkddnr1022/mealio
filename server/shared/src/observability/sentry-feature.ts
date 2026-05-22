import type { SentryFeatureTag } from './sentry.constants';

/**
 * HTTP path에서 Sentry feature 태그를 추론한다.
 */
export function inferFeatureFromHttpPath(path: string): SentryFeatureTag {
  const normalized = path.split('?')[0] ?? path;
  if (normalized.includes('/auth')) return 'auth';
  if (normalized.includes('/chatbot')) return 'chatbot';
  if (normalized.includes('/recipes')) return 'recipes';
  if (normalized.includes('/ingredients')) return 'ingredients';
  if (normalized.includes('/inventory')) return 'inventory';
  if (normalized === '/health' || normalized === '/ready') return 'health';
  if (normalized.includes('/metrics')) return 'metrics';
  return 'unknown';
}

/**
 * Kafka topic에서 Sentry feature 태그를 추론한다.
 */
export function inferFeatureFromKafkaTopic(topic: string): SentryFeatureTag {
  if (topic.includes('chatbot')) return 'chatbot';
  if (topic.includes('recipe')) return 'recipes';
  if (topic.includes('user-events') || topic.includes('activity')) {
    return 'consumer';
  }
  if (topic.includes('cache')) return 'consumer';
  return 'consumer';
}
