import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Type(() => String)
  newPassword!: string;
}
