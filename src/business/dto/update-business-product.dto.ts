import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateBusinessProductDto{
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
    isAvailable?: boolean;

    @IsOptional()
    @IsInt()
    stockCount?: number;
}