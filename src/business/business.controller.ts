import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { RolesGuard } from '../accounts/guards/roles.guard';
import { Role } from '@prisma/client';
import { GetUser } from '../accounts/decorators/get-user.decorator';
import { Roles } from '../accounts/decorators/roles.decorator';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateBusinessProductDto } from './dto/create-business-product.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { fileFilter } from '../utils/filter';
import {
  BusinessDto,
  BusinessProductDataDto,
} from './dto/business-product-data.dto';
import { BusinessCategoriesDto } from './dto/business-category.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ProductCategoriesDto } from './dto/product-category.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) { }

  // POST `/business/setup`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Post('setup')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'bannerImage', maxCount: 1 }], {
      storage: memoryStorage(),
      fileFilter: fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async createBusiness(
    @GetUser('id') ownerId: string,
    @Body() createBusinessDto: CreateBusinessDto,
    @UploadedFiles() files?: { bannerImage: Express.Multer.File },
  ): Promise<{ message: string; data: BusinessDto }> {
    return await this.businessService.createBusiness(
      ownerId,
      createBusinessDto,
      files,
    );
  }

  // PATCH `/business/update/:businessId`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Patch('update/:businessId')
  @UseInterceptors(FileInterceptor('bannerImage'))
  async editBusiness(
    @GetUser('id') ownerId: string,
    @Param('businessId') businessId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @UploadedFile() bannerImage?: Express.Multer.File,
  ): Promise<{ message: string; data: BusinessDto }> {
    return await this.businessService.editBusiness(
      ownerId,
      businessId,
      updateBusinessDto,
      bannerImage,
    );
  }

  // DELETE `/business/:businessId`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Delete(':businessId')
  async deleteBusiness(
    @GetUser('id') ownerId: string,
    @Param('businessId') businessId: string,
  ): Promise<{ message: string }> {
    return await this.businessService.deleteBusiness(ownerId, businessId);
  }

  // POST `/business/product`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Post('product')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: memoryStorage(),
      fileFilter: fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async createBusinessProduct(
    @GetUser('id') userId: string,
    @Body() createBusinessProductDto: CreateBusinessProductDto,
    @UploadedFiles() files?: { images: Express.Multer.File[] },
  ): Promise<{ message: string; data: BusinessProductDataDto }> {
    return await this.businessService.createBusinessProduct(
      createBusinessProductDto,
      userId,
      files,
    );
  }

  // GET `/business/products`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Get('products')
  async getBusinessProducts(
    @GetUser('id') userId: string,
  ): Promise<{ message: string; data: BusinessProductDataDto[] }> {
    return await this.businessService.getBusinessProducts(userId);
  }

  // GET `/business/products/:productId`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Get('products/:productId')
  async getBusinessProductById(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ): Promise<{ message: string; data: BusinessProductDataDto }> {
    return await this.businessService.getBusinessProductById(userId, productId);
  }

  // PATCH `/business/product/:productId/status`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Patch('products/:productId/status')
  async editBusinessProductStatus(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
    @Body('status') status: boolean,
  ): Promise<{ message: string }> {
    return await this.businessService.editBusinessProductStatus(
      status,
      userId,
      productId,
    );
  }

  // DELETE `/business/product/:productId`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Delete('products/:productId')
  async deleteBusinessProduct(
    @GetUser('id') userId: string,
    @Param('productId') productId: string,
  ): Promise<{ message: string }> {
    return await this.businessService.deleteBusinessProduct(userId, productId);
  }

  // POST `/business/categories`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('categories')
  async createBusinessCategory(
    @Body('name') name: string,
    @Body('description') description: string,
    @GetUser('id') adminId: string,
  ): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      description: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }> {
    return await this.businessService.createBusinessCategory(
      name,
      description,
      adminId,
    );
  }

  // GET `/business/categories`
  @UseGuards(JwtAuthGuard)
  @Get('categories')
  async getBusinessCategories(): Promise<{
    message: string;
    data: BusinessCategoriesDto[];
  }> {
    return await this.businessService.getBusinessCategories();
  }

  // POST `/business/products/categories`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('products/categories')
  async createProductCategory(
    @Body('name') name: string,
    @Body('description') description: string,
    @GetUser('id') adminId: string,
  ): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      description: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }> {
    return await this.businessService.createProductCategory(
      name,
      description,
      adminId,
    );
  }

  // GET `/business/products/categories`
  @UseGuards(JwtAuthGuard)
  @Get('products/categories')
  async getBusinessProductCategories(): Promise<{ message: string, data: ProductCategoriesDto[] }> {
    return await this.businessService.getProductCategories();
  }

  // GET `/business/categories/:categoryId`
  @UseGuards(JwtAuthGuard)
  @Get('categories/:categoryName')
  async getBusinessCategoryByName(
    @Param('categoryName') categoryName: string,
  ): Promise<{ message: string; data: BusinessDto[] }> {
    return await this.businessService.getBusinessCategoryByName(categoryName);
  }

  // GET `/business/me`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Get('me')
  async getMyBusinesses(
    @GetUser('id') ownerId: string,
  ): Promise<{ message: string; data: BusinessDto[] }> {
    return await this.businessService.getMyBusinesses(ownerId);
  }
}
