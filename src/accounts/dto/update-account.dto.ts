import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsString()
  @IsOptional()
  @Type(() => String)
  permanentAddress?: string;
}
