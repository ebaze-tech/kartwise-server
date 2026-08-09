import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  @MinLength(3)
  @MaxLength(100)
  @Type(() => String)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business description is required' })
  @MinLength(10)
  @Type(() => String)
  description!: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Business email address is required' })
  @Type(() => String)
  emailAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business phone number is required' })
  @Type(() => String)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business category is required' })
  @Type(() => String)
  businessCategory!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business address is required' })
  @Type(() => String)
  address!: string;
}
