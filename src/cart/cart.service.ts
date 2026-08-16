import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUYER)
      throw new ForbiddenException('Access forbidden');

    const cart = await this.prisma.cart.upsert({
      where: { id: userId },
      update: {},
      create: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stockCount: true,
                isAvailable: true,
                images: true,
                business: { select: { name: true, isActive: true } },
              },
            },
          },
        },
      },
    });

    const cartTotal = cart.items.reduce((sum, item) => {
      if (item.product.isAvailable && item.product.business.isActive) {
        return sum + item.quantity * Number(item.product.price);
      }
      return sum;
    }, 0);

    return {
      message: 'Cart retrieved successfully',
      data: {
        id: cart.id,
        items: cart.items,
        cartTotal,
      },
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUYER)
      throw new ForbiddenException('Access forbidden');

    const product = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId },
      include: { business: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (!product.isAvailable || !product.business.isActive)
      throw new BadRequestException('Product currently unavailable');

    const cart = await this.prisma.cart.upsert({
      where: { id: userId },
      update: {},
      create: { userId: user.id },
    });

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addToCartDto.productId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity || 0) + addToCartDto.quantity;

    if (newQuantity > product.stockCount)
      throw new BadRequestException(
        `Only ${product.stockCount} units available`,
      );

    const cartItem = await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addToCartDto.productId,
        },
      },
      update: {
        quantity: { increment: addToCartDto.quantity },
      },
      create: {
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
      },
    });

    return { message: 'Item added to cart', data: cartItem };
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUYER)
      throw new ForbiddenException('Access forbidden');

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (updateCartItemDto.quantity > product.stockCount)
      throw new BadRequestException(
        `Only ${product.stockCount} units available`,
      );

    const updatedItem = await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: {
        quantity: updateCartItemDto.quantity,
      },
    });

    return { message: 'Cart updated', data: updatedItem };
  }

  async removeCartItem(userId: string, productId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUYER)
      throw new ForbiddenException('Access forbidden');

    const cart = await this.prisma.cart.findUnique({
      where: { id: userId },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    try {
      await this.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      return { message: 'Item removed from cart' };
    } catch (error) {
      throw new NotFoundException('Item not found in your cart');
    }
  }

  async clearCart(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUYER)
      throw new ForbiddenException('Access Forbidden');

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }
}
