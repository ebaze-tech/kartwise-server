export class BusinessCreatedEvent {
  constructor(
    public readonly businessId: string,
    public readonly ownerId: string,
    public readonly businessName: string,
    public readonly businessAddress: string,
    public readonly businessPhoneNumber: string,
    public readonly businessCategory: string,
    public readonly businessCreatedAt: Date,
    public readonly loggedAt: Date,
  ) {}
}
