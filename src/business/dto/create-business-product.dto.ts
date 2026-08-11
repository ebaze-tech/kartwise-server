import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBusinessProductDto {
  @IsNotEmpty({ message: 'Product name is required' })
  @IsString({ message: 'Product name must be a string' })
  @MinLength(5, { message: 'Product name must be at least 5 characters long' })
  @MaxLength(100, {
    message: 'Product name must be at most 100 characters long',
  })
  @Type(() => String)
  name!: string;

  @IsNotEmpty({ message: 'Product description is required' })
  @IsString({ message: 'Product description must be a string' })
  @MinLength(10, {
    message: 'Product description must be at least 10 characters long',
  })
  @MaxLength(100, {
    message: 'Product description must be at most 100 characters long',
  })
  @Type(() => String)
  description!: string;

  @IsNotEmpty({ message: 'Product price is required' })
  @IsNumber({}, { message: 'Product price must be a number' })
  @Type(() => Number)
  price!: number;

  @IsBoolean({ message: 'Product availability must be a boolean value' })
  @Type(() => Boolean)
  isAvailable!: boolean;

  @IsNotEmpty({ message: 'Product stock count is required' })
  @IsNumber({}, { message: 'Product stock count must be a number' })
  @Type(() => Number)
  stockCount!: number;

  @IsNotEmpty({ message: 'Business name is required' })
  @IsString({ message: 'Business name must be a string' })
  @Type(() => String)
  businessName!: string;

  @IsNotEmpty({ message: 'Product category is required' })
  @IsString({ message: 'Product category must be a string' })
  @Type(() => String)
  productCategoryName!: string;
}
