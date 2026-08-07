import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Current email is required' })
  @Type(() => String)
  currentEmail!: string;

  @IsEmail()
  @IsNotEmpty({ message: 'New email is required' })
  @Type(() => String)
  newEmail!: string;
}
