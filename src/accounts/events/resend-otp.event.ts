export class ResendOtpEvent {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly userId: string,
    public readonly otp: string,
    public readonly requestedAt: Date,
  ) {}
}
