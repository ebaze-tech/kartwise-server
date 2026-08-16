import { OrderStatus } from '@prisma/client';

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly businessOrders: {
      id: string;
      orderId: string;
      businessId: string;
      status: OrderStatus;
      subTotal: number;
      deliveryFee: number;
      discount: number;
      totalAmount: number;
      createdAt: Date;
      updatedAt: Date;
      items: {
        id: string;
        businessOrderId: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        createdAt: Date;
        updatedAt: Date;
      }[];
    }[],
  ) {}
}
