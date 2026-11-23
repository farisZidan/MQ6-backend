import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.debug(`[JwtAuthGuard] Request to ${request.url}`);
    this.logger.debug(
      `[JwtAuthGuard] Authorization header: ${authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING'}`,
    );

    if (!authHeader) {
      this.logger.error('[JwtAuthGuard] Authorization header tidak ada!');
      throw new UnauthorizedException('Header Authorization tidak ditemukan.');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.debug(
      `[JwtAuthGuard] handleRequest - err: ${err?.message}, info: ${info?.message}, user: ${user ? 'FOUND' : 'NULL'}`,
    );

    if (err || !user) {
      this.logger.error(
        `[JwtAuthGuard] Authentication failed. Reason: ${info?.message || err?.message || 'Unknown'}`,
      );
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
