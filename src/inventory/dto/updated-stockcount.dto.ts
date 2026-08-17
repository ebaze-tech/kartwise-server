export class updateStockCountDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  businessId: string;
  description: string;
  price: number;
  isAvailable: boolean;
  stockCount: number;
  reservedCount: number;
  productCategoryName: string;
}
