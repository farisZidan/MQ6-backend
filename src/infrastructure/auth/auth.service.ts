import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IAuthService } from '../../application/ports/auth.service.port';
import { Admin } from '../../domain/entities/admin.entity';

@Injectable()
export class AuthService implements IAuthService {
  private readonly adminUser: Admin;

  constructor(private readonly jwtService: JwtService) {
    // Untuk MVP satu admin, kita ambil dari .env
    // Idealnya simpan ke DB, tapi ini lebih simpel untuk P1 awal
    this.adminUser = new Admin(
      'admin-01',
      process.env.ADMIN_USERNAME || 'admin',
      process.env.ADMIN_PASSWORD_HASH || '',
    );
  }

  async validateCredentials(
    username: string,
    pass: string,
  ): Promise<Admin | null> {
    if (username !== this.adminUser.username) return null;

    const isMatch = await bcrypt.compare(pass, this.adminUser.passwordHash);
    if (!isMatch) return null;

    return this.adminUser;
  }

  async generateToken(admin: Admin): Promise<string> {
    const payload = { sub: admin.id, username: admin.username };
    return this.jwtService.signAsync(payload);
  }
}
