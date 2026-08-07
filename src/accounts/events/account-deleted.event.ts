export class AccountDeletedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly deletedAt: Date,
  ) {}
}
