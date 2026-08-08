import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email!: string;
}
