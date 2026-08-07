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
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { RolesGuard } from '../accounts/guards/roles.guard';
import { Role } from '@prisma/client';
import { GetUser } from '../accounts/decorators/get-user.decorator';
import { Roles } from '../accounts/decorators/roles.decorator';
import { create } from 'domain';
import { CreateBusinessDto } from './dto/create-business.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('categories')
  async getCategories() {
    return await this.businessService.getCategories();
  }

  @Get('categories/:categoryId')
  async getBusinessesByCategoryId(@Param('categoryId') categoryId: string) {
    return await this.businessService.getBusinessesByCategoryId(categoryId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Post('setup')
  async createBusiness(
    @GetUser('id') ownerId: string,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    return await this.businessService.createBusiness(
      ownerId,
      createBusinessDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUSINESS_OWNER)
  @Get('my-businesses')
  async getMyBusinesses(@GetUser('id') ownerId: string) {
    return await this.businessService.getMyBusinesses(ownerId);
  }
}
