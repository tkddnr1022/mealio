import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  const config = new DocumentBuilder()
    .setTitle('Recipe Service API')
    .setDescription(
      `레시피 추천 및 재료 관리 서비스 API

## 인증 방식
- Cookie 기반 JWT 인증
- HttpOnly, Secure, SameSite=Strict 설정

## 주요 기능
- 소셜 로그인 (카카오, 구글, 네이버)
- 레시피 조회 및 검색
- 사용자 재료 관리
- AI 챗봇 레시피 추천`,
    )
    .setVersion('1.0.0')
    .setContact('API Support', '', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('https://api.example.com', 'Production server')
    .addServer('https://staging-api.example.com', 'Staging server')
    .addServer('http://localhost:8080', 'Local development server')
    .addTag('Authentication', '인증 관련 API')
    .addTag('User', '사용자 관련 API')
    .addTag('Recipe', '레시피 관련 API')
    .addTag('Ingredient', '재료 관련 API')
    .addTag('Inventory', '사용자 재료함 관련 API')
    .addTag('Chatbot', 'AI 챗봇 관련 API')
    .addTag('Internal', '내부 API')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT 토큰이 포함된 HttpOnly 쿠키',
      },
      'cookieAuth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Internal-API-Key',
        description: '내부 API 인증 키',
      },
      'internalApiKey',
    )
    .build();

  config.security = [{ cookieAuth: [] }];
  return config;
}
