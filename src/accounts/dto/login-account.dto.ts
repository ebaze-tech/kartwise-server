import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginAccountDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  @Type(() => String)
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Type(() => String)
  password!: string;
}
