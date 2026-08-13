import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto {
  @IsString()
  @IsNotEmpty({ message: "Permanent address is required for account update" })
  @Type(() => String)
  permanentAddress?: string;
}
