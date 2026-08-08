import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { BusinessCategoriesDto } from './dto/business-category.dto';
import { CreateBusinessProductDto } from './dto/create-business-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  BusinessDto,
  BusinessProductDataDto,
} from './dto/business-product-data.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import e from 'express';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // create business method
  async createBusiness(
    ownerId: string,
    createBusinessDto: CreateBusinessDto,
    bannerImage?: Express.Multer.File,
  ): Promise<{ message: string; data: BusinessDto }> {
    const {
      name,
      description,
      address,
      emailAddress,
      businessCategoryId,
      phoneNumber,
    } = createBusinessDto;

    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can register a business',
      );

    const category = await this.prisma.businessCategory.findUnique({
      where: { id: businessCategoryId },
    });

    if (!category)
      throw new NotFoundException('Invalid business category selected');

    const email = await this.prisma.business.findUnique({
      where: { emailAddress },
    });
    if (email)
      throw new ConflictException(
        'A business is already registered with this email',
      );

    if (bannerImage && bannerImage.size > 5 * 1024 * 1024)
      throw new BadRequestException('Banner image size exceeds 5MB limit');

    if (
      bannerImage &&
      !['image/jpeg', 'image/png'].includes(bannerImage.mimetype)
    ) {
      throw new BadRequestException(
        'Invalid banner image format. Only JPEG and PNG are allowed.',
      );
    }

    const newBusiness = await this.prisma.$transaction(async (tx) => {
      let business = await tx.business.create({
        data: {
          name,
          description,
          emailAddress,
          phoneNumber,
          address,
          categoryId: businessCategoryId,
          ownerId,
        },
        include: {
          category: true,
        },
      });

      let uploadedBannerImage: string | null = null;
      let imagePublicId: string | null = null;

      try {
        if (bannerImage) {
          const uploadResult = await this.cloudinary.uploadBusinessBannerImage(
            bannerImage,
            user.id,
            business.id,
          );

          uploadedBannerImage = uploadResult.url;
          imagePublicId = uploadResult.publicId;

          if (uploadedBannerImage) {
            business = await tx.business.update({
              where: { id: business.id },
              data: { bannerImageUrl: uploadedBannerImage },
              include: { category: true },
            });
          }
        }
      } catch (error) {
        if (imagePublicId) {
          await this.cloudinary.deleteAsset(imagePublicId, 'image');
        }
        throw new InternalServerErrorException(
          'Failed to upload banner image. Business creation cancelled.',
        );
      }

      await tx.outbox.create({
        data: {
          topic: 'business.created',
          payload: {
            businessId: business.id,
            ownerId: user.id,
            businessName: business.name,
            businessAddress: business.address,
            businessPhoneNumber: business.phoneNumber,
            businessCategory: business.category.name,
            businessCreatedAt: business.createdAt,
            businessBannerImageUrl: business.bannerImageUrl,
            loggedAt: new Date(),
          },
        },
      });

      return business;
    });

    return { message: 'Business created successfully', data: newBusiness };
  }

  // edit business method
  async editBusiness(
    ownerId: string,
    businessId: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<{ message: string; data: BusinessDto }> {
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can edit their businesses',
      );

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new NotFoundException('Business not found');

    if (
      updateBusinessDto.emailAddress &&
      updateBusinessDto.emailAddress !== business.emailAddress
    ) {
      const email = await this.prisma.business.findUnique({
        where: { emailAddress: updateBusinessDto.emailAddress },
      });
      if (email)
        throw new ConflictException(
          'A business is already registered with this email',
        );
    }

    const updatedBusiness = await this.prisma.$transaction(async (tx) => {
      const isBusinessOwner = await tx.business.findFirst({
        where: { AND: [{ id: businessId }, { ownerId }] },
      });

      if (!isBusinessOwner) throw new NotFoundException('Business not found');

      if (isBusinessOwner.ownerId !== ownerId)
        throw new ForbiddenException('You are not the owner of this business');

      const updatedData = await tx.business.update({
        where: { id: business.id },
        data: updateBusinessDto,
        include: {
          category: true,
          products: true,
        },
      });

      await tx.outbox.create({
        data: {
          topic: 'business.updated',
          payload: {
            businessId: updatedData.id,
            ownerId: user.id,
            businessName: updatedData.name,
            businessAddress: updatedData.address,
            businessPhoneNumber: updatedData.phoneNumber,
            businessCategory: updatedData.category.name,
            businessUpdatedAt: new Date(),
            loggedAt: new Date(),
          },
        },
      });

      return updatedData;
    });

    return { message: 'Business updated successfully', data: updatedBusiness };
  }

  async deleteBusiness(
    ownerId: string,
    businessId: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can delete their businesses',
      );

    await this.prisma.$transaction(async (tx) => {
      const isBusinessOwner = await tx.business.findFirst({
        where: { AND: [{ id: businessId }, { ownerId }] },
      });

      if (!isBusinessOwner) throw new NotFoundException('Business not found');

      if (isBusinessOwner.ownerId !== ownerId)
        throw new ForbiddenException('You are not the owner of this business');

      await tx.business.delete({
        where: { id: businessId },
      });
    });

    return { message: 'Business deleted successfully' };
  }

  // create business product method
  async createBusinessProduct(
    createBusinessProductDto: CreateBusinessProductDto,
    files: { images: Express.Multer.File[] },
    userId: string,
  ): Promise<{ message: string; data: BusinessProductDataDto }> {
    const { name, description, price, isAvailable, stockCount, businessName } =
      createBusinessProductDto;

    if (files.images === undefined || files.images === null) {
      throw new BadRequestException('No images uploaded for the product');
    }

    if (files.images.length === 0 || files.images.length > 5) {
      throw new BadRequestException(
        'You must upload between 1 and 5 images for the product',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException('Only business owners can create products');

    const business = await this.prisma.business.findFirst({
      where: { AND: [{ name: businessName }, { ownerId: userId }] },
    });
    if (!business) throw new NotFoundException('Business not found');

    const existingProduct = await this.prisma.product.findFirst({
      where: { AND: [{ name }, { businessId: business.id }] },
    });
    if (existingProduct)
      throw new ConflictException(
        'A product with this name already exists for the specified business',
      );

    const newProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          price,
          isAvailable,
          stockCount: Number(stockCount),
          businessId: business.id,
        },
      });

      let uploadedImages: {
        url: string;
        publicId: string;
      }[] = [];

      try {
        uploadedImages = await Promise.all(
          files.images.map(
            async (file) =>
              await this.cloudinary.uploadBusinessProductImages(
                file,
                user.id,
                business.id,
                product.id,
              ),
          ),
        );
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to upload images. Product creation cancelled.',
        );
      }

      if (uploadedImages.length > 0) {
        await tx.productImages.createMany({
          data: uploadedImages.map((image) => ({
            productId: product.id,
            url: image.url,
            publicId: image.publicId,
          })),
        });
      }

      return await tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, business: true },
      });
    });

    return {
      message: 'Product created successfully',
      data: newProduct as unknown as BusinessProductDataDto,
    };
  }

  // edit business product status method
  async editBusinessProductStatus(
    status: boolean,
    userId: string,
    productId: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can edit their products',
      );

    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          AND: [{ id: productId }, { business: { ownerId: userId } }],
        },
        include: { business: true },
      });

      if (!product) throw new NotFoundException('Product not found');

      await tx.product.update({
        where: { id: productId },
        data: { isAvailable: status },
      });
    });

    return { message: 'Product status updated successfully' };
  }

  // get business products method
  async getBusinessProducts(
    userId: string,
  ): Promise<{ message: string; data: BusinessProductDataDto[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can access their products',
      );

    const products = await this.prisma.product.findMany({
      where: { business: { ownerId: userId } },
      include: { images: true, business: true },
      orderBy: [
        {
          createdAt: 'desc',
        },
        { name: 'asc' },
        { price: 'asc' },
        { stockCount: 'asc' },
      ],
    });

    return {
      message: 'Products data fetched successfully',
      data: products as unknown as BusinessProductDataDto[],
    };
  }

  // get business product by id method
  async getBusinessProductById(
    userId: string,
    productId: string,
  ): Promise<{ message: string; data: BusinessProductDataDto }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException(
        'Only business owners can access their products',
      );

    const product = await this.prisma.product.findFirst({
      where: { AND: [{ id: productId }, { business: { ownerId: userId } }] },
      include: { images: true, business: true },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          name: 'asc',
        },
        {
          price: 'asc',
        },
        {
          stockCount: 'asc',
        },
      ],
    });

    if (!product) throw new NotFoundException('Product not found');

    return {
      message: 'Product data fetched successfully',
      data: product as unknown as BusinessProductDataDto,
    };
  }

  // delete business product method
  async deleteBusinessProduct(
    userId: string,
    productId: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.prisma.product.findFirst({
      where: { AND: [{ id: productId }, { business: { ownerId: userId } }] },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (user.role !== Role.BUSINESS_OWNER) {
      throw new ForbiddenException(
        'Only business owners can delete their products',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const isProductOwner = await tx.product.findFirst({
        where: { AND: [{ id: productId }, { business: { ownerId: userId } }] },
      });
      if (!isProductOwner)
        throw new ForbiddenException('You are not the owner of this product');

      await tx.product.delete({
        where: { id: productId },
      });
    });

    return { message: 'Product deleted successfully' };
  }

  // get business categories method
  async getBusinessCategories(): Promise<{
    message: string;
    data: BusinessCategoriesDto[];
  }> {
    const categories = await this.prisma.businessCategory.findMany({
      include: {
        businesses: true,
      },
      orderBy: [{ name: 'asc' }, { businesses: { _count: 'desc' } }],
    });

    if (
      categories.length === 0 ||
      categories === null ||
      categories === undefined ||
      !categories
    )
      throw new NotFoundException('No business categories found');

    return {
      message: 'Business categories data fetched successfully',
      data: categories,
    };
  }

  // get businesses by category id method
  async getBusinessCategoryById(
    categoryId: string,
  ): Promise<{ message: string; data: BusinessDto[] }> {
    const category = await this.prisma.businessCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const businesses = await this.prisma.business.findMany({
      where: { categoryId: category.id },
      include: {
        category: true,
        products: true,
      },
      orderBy: [
        {
          name: 'asc',
        },
        { products: { _count: 'desc' } },
        { category: { name: 'asc' } },
      ],
    });

    return {
      message: 'Businesses data fetched successfully',
      data: businesses,
    };
  }

  // get my businesses method
  async getMyBusinesses(
    ownerId: string,
  ): Promise<{ message: string; data: BusinessDto[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.BUSINESS_OWNER)
      throw new ForbiddenException('Not a business owner');

    const businesses = await this.prisma.business.findMany({
      where: { ownerId },
      include: {
        category: true,
        products: true,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        { products: { _count: 'desc' } },
        { category: { name: 'asc' } },
      ],
    });

    return { message: 'Business data fetched successfully', data: businesses };
  }

  // get all businesses method
  async getAllBusinesses(
    userId: string,
  ): Promise<{ message: string; data: BusinessDto[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.ADMIN)
      throw new ForbiddenException(
        'Only administrators can access all businesses',
      );

    const businesses = await this.prisma.business.findMany({
      include: {
        category: true,
        products: true,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        { products: { _count: 'desc' } },
        { category: { name: 'asc' } },
      ],
    });

    return { message: 'Business data fetched successfully', data: businesses };
  }
}
