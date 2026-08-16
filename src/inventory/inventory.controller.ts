import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderCreatedEvent } from './events/order-created.event';
import { PrismaService } from '../prisma/prisma.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() event: OrderCreatedEvent) {
    const isReserved = await this.inventoryService.reserveProductStock(event);

    if (isReserved) {
      await this.prisma.outbox.create({
        data: {
          topic: 'inventory.reserved',
          payload: {
            orderId: event.orderId,
          },
        },
      });
    } else {
      await this.prisma.outbox.create({
        data: {
          topic: 'inventory.failed',
          payload: {
            orderId: event.orderId,
          },
        },
      });
    }
  }
}
