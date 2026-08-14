import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from "@nestjs/common/exceptions";
import { ProductsDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  // async findProducts(userId: string): Promise<{ message: string, data: ProductsDto[] }> {
  async findProducts(userId: string) {
    if (!userId) throw new UnauthorizedException('User not authorized');

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) throw new UnauthorizedException('User not found');

    if (user && user.role !== 'BUYER') throw new UnauthorizedException('User not authorized');

    const products = await this.prisma.product.findMany({ select: {
      id:true, name:true, description:true, price:true, isAvailable:true, stockCount:true, businessId:true, productCategoryName:true, createdAt:true, updatedAt:true,
      images: { select: { id:true, url:true, publicId:true, productId:true, createdAt:true, updatedAt:true } },
      productReviews: { select: { id:true, productId:true, rating:true, comment:true, createdAt:true, updatedAt:true } }
    } })
  }
}
