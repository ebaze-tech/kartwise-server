export class EmailVerifiedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly verifiedAt: Date,
  ) {}
}
