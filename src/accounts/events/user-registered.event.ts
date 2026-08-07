import { Role } from '@prisma/client';

export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: Role,
    public readonly emailVerified: boolean,
    public readonly otp: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly loggedAt: Date,
  ) {}
}
