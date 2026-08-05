import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UserAccountDto } from './dto/user-account.dto';
import { LoginAccountDto } from './dto/login-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('signup')
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    return await this.accountsService.createAccount(createAccountDto);
  }

  @Post('signin')
  async loginAccount(
    @Body() loginAccountDto: LoginAccountDto,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    return await this.accountsService.loginAccount(loginAccountDto);
  }
}
