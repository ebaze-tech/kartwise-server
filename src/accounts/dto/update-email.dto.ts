import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Current email is required' })
  @Type(() => String)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Current email must be a valid email address',
  })
  currentEmail: string;

  @IsEmail()
  @IsNotEmpty({ message: 'New email is required' })
  @Type(() => String)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'New email must be a valid email address',
  })
  newEmail: string;
}
