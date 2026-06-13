/** 클라이언트 인증 상태. `Loading`은 비영속( localStorage 미저장 ). */
export enum AuthStatus {
  Loading,
  Authenticated,
  Unauthenticated,
}
