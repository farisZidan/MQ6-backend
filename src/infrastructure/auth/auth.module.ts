// src/infrastructure/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- Tambahkan ini
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AUTH_SERVICE_TOKEN } from '../../application/ports/auth.service.port';
import { AuthLoginUseCase } from '../../application/use-cases/auth-login.use-case';
import { AuthController } from '../../presentation/http/auth/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Gunakan registerAsync agar ConfigService sudah siap
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        console.log(
          '=== JWT MODULE SECRET ===',
          secret?.substring(0, 5) + '...',
        );

        return {
          secret: secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
              '1d') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthLoginUseCase,
    JwtStrategy,
    {
      provide: AUTH_SERVICE_TOKEN,
      useClass: AuthService,
    },
  ],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
