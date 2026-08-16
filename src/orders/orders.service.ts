import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientKafka } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { KafkaService } from '../kafka/kafka.service';

interface PreparedOrderItem {
  productId: string;
  businessId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const deliveryFee = 0;
const discount = 0;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // method to initialize an order
  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<{ message: string; data: OrderResponseDto }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const productIds = [
      ...new Set(createOrderDto.items.map((item) => item.productId)),
    ];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { business: true },
    });

    if (products.length !== productIds.length)
      throw new BadRequestException('One or more products do not exist');

    const preparedItems: PreparedOrderItem[] = [];

    let subTotal = 0;

    for (const item of createOrderDto.items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product)
        throw new BadRequestException(`Product ${item.productId} not found`);

      if (!product.business.isActive)
        throw new BadRequestException(
          `${product.business.name} is currently unavailable`,
        );

      if (!product.isAvailable)
        throw new BadRequestException(`${product.name} is unavailable`);

      const unitPrice = Number(product.price);

      const totalPrice = unitPrice * item.quantity;

      subTotal += totalPrice;

      preparedItems.push({
        productId: product.id,
        businessId: product.businessId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    const businessOrders = new Map<string, PreparedOrderItem[]>();

    for (const item of preparedItems) {
      if (!businessOrders.has(item.businessId)) {
        businessOrders.set(item.businessId, []);
      }

      businessOrders.get(item.businessId)!.push(item);
    }

    const totalAmount = subTotal + deliveryFee - discount;

    const savedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          shippingAddress: createOrderDto.shippingAddress,
          subTotal,
          deliveryFee,
          discount,
          totalAmount,
          status: 'PENDING',

          businessOrders: {
            create: Array.from(businessOrders.entries()).map(
              ([businessId, items]) => {
                const businessSubTotal = items.reduce(
                  (sum, item) => sum + item.totalPrice,
                  0,
                );

                return {
                  businessId,
                  subTotal: businessSubTotal,
                  deliveryFee: 0,
                  discount: 0,
                  totalAmount: businessSubTotal,
                  status: 'PENDING',

                  items: {
                    create: items.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                    })),
                  },
                };
              },
            ),
          },
        },
        include: {
          businessOrders: {
            include: { items: true },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });

      await tx.outbox.create({
        data: {
          topic: 'order.created',
          payload: {
            orderId: order.id,
            userId: order.userId,
            status: order.status,
            businessOrders: order.businessOrders,
          },
        },
      });
      return order;
    });

    const orderData = {
      ...savedOrder,
      subTotal: Number(savedOrder.subTotal),
      deliveryFee: Number(savedOrder.deliveryFee),
      discount: Number(savedOrder.discount),
      totalAmount: Number(savedOrder.totalAmount),

      businessOrders: savedOrder.businessOrders.map((businessOrder) => ({
        ...businessOrder,
        subTotal: Number(businessOrder.subTotal),
        deliveryFee: Number(businessOrder.deliveryFee),
        discount: Number(businessOrder.discount),
        totalAmount: Number(businessOrder.totalAmount),

        items: businessOrder.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      })),
    };
    return {
      message: 'Order initiated successfully. Awaiting confirmation',
      data: orderData,
    };
  }

  // method to cancel an order

  async cancelOrder(orderId: string, reason: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });

        await tx.businessOrder.updateMany({
          where: { orderId: orderId },
          data: { status: 'CANCELLED' },
        });

        await tx.outbox.create({
          data: {
            topic: 'order.cancelled',
            payload: {
              orderId: orderId,
              reason: reason,
              userId: user.id,
            },
          },
        });
      });

      this.logger.log(
        `Successfully cancelled Order ${orderId}. Reason: ${reason}`,
      );
    } catch (error) {
      this.logger.error(
        `CRITICAL: Failed to cancel Order ${orderId}: ${error}`,
      );
    }
  }
}
