export class Admin {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly passwordHash: string,
  ) {}
}
