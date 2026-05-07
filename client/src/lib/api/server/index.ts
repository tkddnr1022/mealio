import 'server-only';

export {
  buildForwardCookieHeader,
  getInboundAcceptLanguage,
  getInboundCorrelationId,
} from './forward-headers';
export {
  withForwardedHeaders,
  type ForwardKind,
} from './with-forwarded-headers';
