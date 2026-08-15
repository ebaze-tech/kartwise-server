import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetUser } from '../accounts/decorators/get-user.decorator';
import { ProductsDto } from './dto/products.dto';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { Roles } from '../accounts/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Get()
  async findProducts(@GetUser('id') userId: string): Promise<{ message: string, data: ProductsDto[] }> {
    return await this.productsService.findProducts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.BUYER)
  @Get(':id')
  async findProductById(@Param('id') productId: string, @GetUser('id') userId: string): Promise<{ message: string, data: ProductsDto }> {
    return await this.productsService.findProductById(productId, userId);
  }
}
