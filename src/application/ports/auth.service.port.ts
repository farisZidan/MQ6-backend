import { Admin } from '../../domain/entities/admin.entity';

export const AUTH_SERVICE_TOKEN = 'IAuthService';

export interface IAuthService {
  validateCredentials(username: string, pass: string): Promise<Admin | null>;
  generateToken(admin: Admin): Promise<string>;
}
