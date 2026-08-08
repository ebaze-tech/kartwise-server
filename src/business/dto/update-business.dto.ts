import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  @Type(() => String)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @Type(() => String)
  description?: string;

  @IsEmail()
  @IsOptional()
  @Type(() => String)
  emailAddress?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  address?: string;

  @IsUUID()
  @IsOptional()
  @Type(() => String)
  categoryId?: string;
}
