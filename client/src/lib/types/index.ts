/**
 * `@/lib/types` 배럴 (barrel export).
 *
 * 도메인별 타입을 하나의 경로로 묶어 import 편의성을 제공한다.
 * 개별 도메인 타입은 각 하위 파일(`./user`, `./recipe` 등)에서 직접 import해도 된다.
 */

export * from './api';
export * from './auth';
export * from './user';
export * from './recipe';
export * from './ingredient';
export * from './inventory';
export * from './chatbot';
