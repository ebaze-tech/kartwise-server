import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Type(() => String)
  otp!: string;
}
