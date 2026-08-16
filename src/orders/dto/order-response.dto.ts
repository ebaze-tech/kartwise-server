export class OrderItemResponseDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class BusinessOrderResponseDto {
  id: string;
  businessId: string;
  status: string;
  subTotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  items: OrderItemResponseDto[];
}

export class OrderResponseDto {
  id: string;
  userId: string;
  status: string;

  subTotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;

  businessOrders: BusinessOrderResponseDto[];

  createdAt: Date;
  updatedAt: Date;
}
