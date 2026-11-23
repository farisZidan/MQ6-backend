import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AUTH_SERVICE_TOKEN } from '../../application/ports/auth.service.port';
import { AuthLoginUseCase } from '../../application/use-cases/auth-login.use-case';
import { AuthController } from '../../presentation/http/auth/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any },
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
  exports: [PassportModule],
})
export class AuthModule {}
