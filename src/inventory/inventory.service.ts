import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderCreatedEvent } from './events/order-created.event';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reserveProductStock(event: OrderCreatedEvent): Promise<boolean> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: event.orderId },
        include: {
          businessOrders: {
            include: { items: true },
          },
        },
      });

      if (!order) {
        this.logger.error(`Order ${event.orderId} not found`);
        return false;
      }

      const allOrderItems = order.businessOrders.flatMap(
        (businessOrder) => businessOrder.items,
      );

      await this.prisma.$transaction(async (tx) => {
        for (const item of allOrderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockCount: true, name: true },
          });

          if (!product) throw new Error(`Product ${item.productId} not found`);

          if (product.stockCount < item.quantity)
            throw new Error(`Insufficient stock for ${product.name}`);

          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stockCount: { decrement: item.quantity },
              reservedCount: { increment: item.quantity },
            },
          });
        }
      });

      this.logger.log(`Stock reserved for order ${event.orderId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to reserve stock for order ${event.orderId}`);
      return false;
    }
  }
}
