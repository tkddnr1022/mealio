import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthCallbackGuard } from '../guards/oauth-callback.guard';
import { OAuthProfile } from '../types/oauth.types';
import { ConfigService } from '@nestjs/config';
import { SUPPORTED_AUTH_PROVIDERS } from '../constants/auth-providers';
// TODO: refresh token 구현
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000; // 1h

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('cookieAuth')
  @ApiOperation({
    summary: '로그아웃',
    description: '로그아웃 및 accessToken 쿠키 삭제',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '로그아웃 성공 (Set-Cookie로 accessToken 무효화)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'accessToken 없음·만료·무효',
  })
  async logout(
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Get(':provider')
  @ApiOperation({
    summary: 'OAuth 로그인 진입 (소셜)',
    description: `백엔드 주도 OAuth 진입. Provider 인증 페이지로 302 리다이렉트. 지원 provider: ${SUPPORTED_AUTH_PROVIDERS.join(', ')}`,
  })
  @ApiParam({
    name: 'provider',
    description: 'OAuth Provider',
    enum: SUPPORTED_AUTH_PROVIDERS,
  })
  @ApiQuery({
    name: 'next',
    required: false,
    description: '로그인 완료 후 이동할 프론트 상대 경로(`/` 시작, `//` 금지)',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Provider 인증 URL로 리다이렉트',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 provider',
  })
  async login(
    @Param('provider') provider: string,
    @Query('next') next: string | undefined,
    @Res({ passthrough: false }) res: express.Response,
  ): Promise<void> {
    const state = this.authService.buildOAuthState(next);
    const url = this.authService.getAuthUrl(provider, state);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(':provider/callback')
  @UseGuards(OAuthCallbackGuard)
  @ApiOperation({
    summary: 'OAuth 콜백 (Provider → 백엔드)',
    description:
      'Provider 인증 후 호출. Code 교환·사용자 생성/조회·JWT 발급 후 클라이언트 로그인 성공 URL로 302 + Set-Cookie',
  })
  @ApiParam({ name: 'provider', enum: SUPPORTED_AUTH_PROVIDERS })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      '성공 시 프론트 최종 경로(+Set-Cookie), 실패 시 FRONTEND_OAUTH_ERROR_PATH(errorCode/errorMessage 등)로 리다이렉트',
  })
  async callback(
    @Param('provider') _provider: string,
    @Query('code') _code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('next') next: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Query('error_description') oauthErrorDescription: string | undefined,
    @Req() req: { user: OAuthProfile },
    @Res({ passthrough: false }) res: express.Response,
  ): Promise<void> {
    const providerErrorRedirect =
      this.authService.buildOAuthProviderErrorRedirectUrl({
        next,
        state,
        oauthError,
        oauthErrorDescription,
      });
    if (providerErrorRedirect) {
      res.redirect(HttpStatus.FOUND, providerErrorRedirect);
      return;
    }

    const safeNext = this.authService.resolveOAuthCallbackSafeNext(next, state);

    const profile = req.user;
    const user = await this.authService.findOrCreateUser(profile);
    const token = this.authService.signToken(user.id);

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      // domain: this.config.getOrThrow<string>('COOKIE_DOMAIN'),
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    const redirectUrl = this.authService.buildLoginSuccessRedirectUrl(safeNext);
    res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
