import { Role } from '@prisma/client';

export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: Role,
    public readonly sessionId: string,
    public readonly loggedAt: Date,
  ) {}
}
