import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { GetUser } from '../accounts/decorators/get-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryEvent } from './events/inventory.event';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrders(
    @GetUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return await this.ordersService.createOrder(createOrderDto, userId);
  }

  @EventPattern('inventory.failed')
  async handleInventoryFailure(@Payload() event: InventoryEvent) {
    await this.ordersService.cancelOrder(
      event.orderId,
      'Inventory reservation failed due to insufficient stock',
    );
  }
}
