export class ChangeEmailRequestEvent {
  constructor(
    public readonly userId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
    public readonly otp: string,
    public readonly requestAt: Date,
  ) {}
}
