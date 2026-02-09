import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@cook/shared';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OAuthCallbackGuard } from './guards/oauth-callback.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaModule } from '../../infrastructure/kafka/kafka.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    KafkaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    JwtAuthGuard,
    OAuthCallbackGuard,
  ],
  exports: [JwtAuthGuard, JwtModule, AuthService],
})
export class AuthModule {}
