import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  @Type(() => String)
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and contain at least one letter and one number',
  })
  @Type(() => String)
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  @Type(() => String)
  @IsEnum(Role, { message: 'Valid user role required for registration' })
  role: Role;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @Matches(/^[a-zA-Z]{2,50}$/, {
    message:
      'First name must be between 2 and 50 characters long and can only contain letters',
  })
  @Type(() => String)
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @Matches(/^[a-zA-Z]{2,50}$/, {
    message:
      'Last name must be between 2 and 50 characters long and can only contain letters',
  })
  @Type(() => String)
  lastName: string;
}
