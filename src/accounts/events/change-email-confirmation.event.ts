export class ChangeEmailConfirmationEvent {
  constructor(
    public readonly userId: string,
    public readonly newEmail: string,
    public readonly emailVerified: boolean,
    public readonly changedAt: Date,
  ) {}
}
