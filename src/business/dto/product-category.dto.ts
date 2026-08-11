import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductImageDto {
    @IsString()
    id!: string;

    @IsString()
    url!: string;

    @IsString()
    publicId!: string;

    @IsString()
    productId!: string;

    createdAt!: Date;
    updatedAt!: Date;
}

export class ProductReviewDto {
    @IsString()
    id!: string;

    @IsInt()
    rating!: number;

    @IsOptional()
    @IsString()
    comment!: string | null;

    @IsString()
    productId!: string;

    createdAt!: Date;
    updatedAt!: Date;
}

export class ProductDto {
    @IsString()
    id!: string;

    @IsString()
    name!: string;

    @IsString()
    description!: string;

    @IsNumber()
    price!: number;

    isAvailable!: boolean;

    @IsInt()
    stockCount!: number;

    @IsString()
    businessId!: string;

    @IsString()
    productCategoryName!: string;

    createdAt!: Date;
    updatedAt!: Date;

    @Type(() => ProductImageDto)
    images!: ProductImageDto[];

    @Type(() => ProductReviewDto)
    productReviews!: ProductReviewDto[];
}

export class ProductCategoriesDto {
    @IsString()
    id!: string;

    @IsString()
    name!: string;

    @IsString()
    description!: string;

    createdAt!: Date;
    updatedAt!: Date;

    @Type(() => ProductDto)
    products!: ProductDto[];
}