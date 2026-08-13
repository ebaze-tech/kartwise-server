import { Role } from '@prisma/client';

export class UserAccountDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  university?: string | null;
  permanentAddress?: string | null;
  role!: Role;
  email!: string;
  profilePictureUrl?: string | null;
  emailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
