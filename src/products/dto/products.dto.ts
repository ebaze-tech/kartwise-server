export class ProductImagesDto {
  id: string;
  url: string;
  publicId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductReviewsDto {
  id: string;
  productId: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export class ProductsDto {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  stockCount: number;
  businessId: string;
  productCategoryName: string;
  images: ProductImagesDto[];
  productReviews: ProductReviewsDto[];
  createdAt: Date;
  updatedAt: Date;
}
