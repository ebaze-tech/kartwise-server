export class ResetPasswordConfirmationEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly changedAt: Date,
  ) {}
}
