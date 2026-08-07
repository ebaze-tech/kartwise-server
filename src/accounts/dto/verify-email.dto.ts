import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  otp!: string;
}
