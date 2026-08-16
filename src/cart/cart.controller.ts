import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { Roles } from '../accounts/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../accounts/decorators/get-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Get()
  async getCart(@GetUser('id') userId: string) {
    return await this.cartService.getCart(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Post()
  async addToCart(
    @GetUser('id') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return await this.cartService.addToCart(userId, addToCartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Patch(':productId')
  async updateCartItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateCartItem(
      userId,
      productId,
      updateCartItemDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Delete(':productId')
  async removeCartItem(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return await this.cartService.removeCartItem(userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Delete()
  async clearCart(@GetUser('id') userId: string) {
    return await this.cartService.clearCart(userId);
  }
}
