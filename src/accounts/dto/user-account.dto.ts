export class UserAccountDto {
  username!: string;
  email!: string;
  profilePictureUrl?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
