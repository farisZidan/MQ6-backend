// src/infrastructure/auth/jwt.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    // Ambil secret dari ConfigService (dijamin sudah termuat)
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('FATAL: JWT_SECRET tidak ditemukan di .env!');
    }

    // Log untuk memastikan secret yang dipakai sama dengan saat login
    console.log('=== JWT STRATEGY SECRET ===', secret.substring(0, 5) + '...');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // <-- Gunakan variabel dari ConfigService
    });
  }

  async validate(payload: any) {
    this.logger.debug(
      `[JwtStrategy] validate() called. Payload: ${JSON.stringify(payload)}`,
    );

    if (!payload || !payload.sub) {
      this.logger.error('[JwtStrategy] Payload tidak memiliki sub.');
      throw new UnauthorizedException('Token tidak valid.');
    }

    return { userId: payload.sub, username: payload.username };
  }
}
