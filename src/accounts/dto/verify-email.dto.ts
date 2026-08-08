import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  userId!: string;
}
