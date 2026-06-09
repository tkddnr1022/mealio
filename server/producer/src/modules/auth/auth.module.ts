import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from '@mealio/shared';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { OAuthCallbackGuard } from './guards/oauth-callback.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthRefreshSessionRepository } from '../../infrastructure/database/repositories/postgresql/auth-refresh-session.repository';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';
import { ACCESS_TOKEN_TTL_SECONDS } from '../../policy/auth.policy';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        },
      }),
      inject: [ConfigService],
    }),
    KafkaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    AuthRefreshSessionRepository,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    OAuthCallbackGuard,
  ],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, JwtModule, AuthService],
})
export class AuthModule {}
