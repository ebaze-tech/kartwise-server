export class BusinessDto {
  id: string;
  name: string;
  description: string;
  emailAddress: string;
  phoneNumber: string;
  address: string;
  categoryId: string;
  bannerImageUrl?: string | null;
  category: {
    id: string;
    name: string;
    description: string;
  };
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  stockCount: number;
  business: {
    id: string;
    name: string;
    description: string;
  };
}

export class ProductImageDto {
  id: string;
  url: string;
  publicId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BusinessProductDataDto {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  stockCount: number;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  business: BusinessDto;
  images: ProductImageDto[];
}
