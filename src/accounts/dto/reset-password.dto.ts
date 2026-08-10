import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Type(() => String)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'New password must be at least 8 characters long and contain at least one letter and one number',
  })
  newPassword!: string;
}
