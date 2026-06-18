import { DocumentBuilder } from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE_NAME } from '../constants/auth-cookie.constants';

export function createSwaggerConfig() {
  const config = new DocumentBuilder()
    .setTitle('Mealio Producer API')
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
    .setContact('API Support', '', 'tkddnr10222@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('https://api.example.com', 'Production server')
    .addServer('http://localhost:3000', 'Local development server')
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
        name: ACCESS_TOKEN_COOKIE_NAME,
        description: 'JWT 토큰이 포함된 HttpOnly 쿠키',
      },
      'cookieAuth',
    )
    .build();

  config.security = [{ cookieAuth: [] }];
  return config;
}
