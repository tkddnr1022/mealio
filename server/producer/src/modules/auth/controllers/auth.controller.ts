import {
  Controller,
  Get,
  HttpException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
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
import type { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import { OAuthCallbackExceptionFilter } from '../filters/oauth-callback-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthCallbackGuard } from '../guards/oauth-callback.guard';
import { ConfigService } from '@nestjs/config';
import { SUPPORTED_AUTH_PROVIDERS } from '../constants/auth-providers';
import type {
  RequestWithOAuthProfile,
  RequestWithUser,
} from '../types/request.types';

// TODO: 환경 변수로 관리
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

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
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.revokeAllUserSessions(req.user.id);
    this.clearAuthCookies(res);
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
  login(
    @Param('provider') provider: string,
    @Query('next') next: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ): void {
    const state = this.authService.buildOAuthState(next);
    const url = this.authService.getAuthUrl(provider, state);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(':provider/callback')
  @UseFilters(OAuthCallbackExceptionFilter)
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
    @Req() req: RequestWithOAuthProfile,
    @Res({ passthrough: false }) res: Response,
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
    const issued = await this.authService.issueTokens(user.id, {
      userAgent: req.get('user-agent') || undefined,
      ipAddress: req.ip || undefined,
    });
    this.setAuthCookies(res, issued.accessToken, issued.refreshToken);

    const redirectUrl = this.authService.buildLoginSuccessRedirectUrl(safeNext);
    res.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신',
    description:
      'Refresh Token 쿠키를 검증해 Access/Refresh Token을 회전 발급한다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '토큰 갱신 성공 (Set-Cookie로 access/refresh 동시 갱신)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'refreshToken 없음·만료·무효·재사용',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const { refreshToken } = this.getAuthCookies(req);
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      this.clearAuthCookies(res);
      throw new HttpException(
        'Refresh token is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const issued = await this.authService.rotateTokens(refreshToken, {
        userAgent: req.get('user-agent') || undefined,
        ipAddress: req.ip || undefined,
      });
      this.setAuthCookies(res, issued.accessToken, issued.refreshToken);
      return { success: true };
    } catch (error) {
      this.clearAuthCookies(res);
      throw error;
    }
  }

  private getAuthCookies(req: Request): {
    accessToken: string;
    refreshToken: string;
  } {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    return {
      accessToken: cookies?.[ACCESS_TOKEN_COOKIE_NAME] ?? '',
      refreshToken: cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? '',
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      maxAge: this.authService.getAccessTokenCookieMaxAgeMs(),
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      maxAge: this.authService.getRefreshTokenCookieMaxAgeMs(),
      path: '/',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/',
    });
  }

  private isSecureCookie(): boolean {
    return this.config.getOrThrow<string>('NODE_ENV') !== 'development';
  }
}
