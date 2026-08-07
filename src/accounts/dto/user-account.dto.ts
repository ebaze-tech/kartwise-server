import { Role } from '@prisma/client';

export class UserAccountDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  role!: Role;
  email!: string;
  profilePictureUrl?: string | null;
  emailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
