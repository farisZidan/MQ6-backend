import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthLoginUseCase } from '../../../application/use-cases/auth-login.use-case';
import { LoginDto } from './dto/login.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authLoginUseCase: AuthLoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authLoginUseCase.execute(
      dto.username,
      dto.password,
    );
    return {
      success: true,
      data: result,
    };
  }
}
