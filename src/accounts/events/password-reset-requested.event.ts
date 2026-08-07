export class PasswordResetRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly otp: string,
    public readonly requestedAt: Date,
  ) {}
}
