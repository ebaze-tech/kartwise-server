import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Type(() => String)
  newPassword!: string;
}
