import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { BusinessDto } from './dto/business.dto';
import { BusinessCategoriesDto } from './dto/business-category.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async createBusiness(
    ownerId: string,
    createBusinessDto: CreateBusinessDto,
  ): Promise<{ message: string; data: BusinessDto }> {
    const {
      name,
      description,
      address,
      emailAddress,
      businessCategoryId,
      phoneNumber,
    } = createBusinessDto;

    if (
      !name ||
      !description ||
      !address ||
      !emailAddress ||
      !businessCategoryId ||
      !phoneNumber
    )
      throw new BadRequestException('All fields are required');

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

    const newBusiness = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
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
            loggedAt: new Date(),
          },
        },
      });

      return business;
    });

    return { message: 'Business created successfully', data: newBusiness };
  }

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
      },
    });

    return { message: 'Business data fetched successfully', data: businesses };
  }

  async getCategories(): Promise<{
    message: string;
    data: BusinessCategoriesDto[];
  }> {
    const categories = await this.prisma.businessCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        businesses: true,
      },
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
  async getBusinessesByCategoryId(
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
      },
    });

    return {
      message: 'Businesses data fetched successfully',
      data: businesses,
    };
  }
}
