import { Inject, Injectable } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN } from '../ports/auth.service.port';
import type { IAuthService } from '../ports/auth.service.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

@Injectable()
export class AuthLoginUseCase {
  constructor(
    @Inject(AUTH_SERVICE_TOKEN)
    private readonly authService: IAuthService,
  ) {}

  async execute(
    username: string,
    pass: string,
  ): Promise<{ accessToken: string }> {
    const admin = await this.authService.validateCredentials(username, pass);

    if (!admin) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.authService.generateToken(admin);
    return { accessToken };
  }
}
