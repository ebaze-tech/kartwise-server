import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  email!: string;
}
