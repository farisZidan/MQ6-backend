export class InvalidCredentialsError extends Error {
  constructor() {
    super('Username atau password salah');
    this.name = 'InvalidCredentialsError';
  }
}
