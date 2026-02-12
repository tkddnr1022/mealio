import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from '../auth.service';
import { OAuthCallbackGuard } from '../guards/oauth-callback.guard';
import { OAuthProfile } from '../types/oauth.types';
import { ConfigService } from '@nestjs/config';
// TODO: refresh token 구현
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000; // 1h

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get(':provider')
  @ApiOperation({
    summary: 'OAuth 로그인 진입 (소셜)',
    description:
      '백엔드 주도 OAuth 진입. Provider 인증 페이지로 302 리다이렉트. 지원 provider: google, kakao, naver',
  })
  @ApiParam({ name: 'provider', description: 'OAuth Provider', enum: ['google', 'kakao', 'naver'] })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Provider 인증 URL로 리다이렉트' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 provider' })
  async login(
    @Param('provider') provider: string,
    @Res({ passthrough: false }) res: express.Response,
  ): Promise<void> {
    const state = this.authService.generateState();
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
  @ApiParam({ name: 'provider', enum: ['google', 'kakao', 'naver'] })
  @ApiResponse({ status: HttpStatus.FOUND, description: '로그인 성공 URL로 리다이렉트 + Set-Cookie' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'OAuth 인증 실패' })
  async callback(
    @Param('provider') _provider: string,
    @Query('code') _code: string,
    @Query('state') _state: string | undefined,
    @Req() req: { user: OAuthProfile },
    @Res({ passthrough: false }) res: express.Response,
  ): Promise<void> {
    const profile = req.user;
    const user = await this.authService.findOrCreateUser(profile);
    const token = this.authService.signToken(user.id);

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    const redirectUrl = this.authService.getLoginSuccessRedirectUrl();
    res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
