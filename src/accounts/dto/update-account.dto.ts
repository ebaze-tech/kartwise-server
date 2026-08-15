import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @Type(() => String)
  permanentAddress?: string;
}
