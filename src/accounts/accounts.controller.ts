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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UserAccountDto } from './dto/user-account.dto';
import { LoginAccountDto } from './dto/login-account.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { UpdateEmailDto } from './dto/update-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-otp.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  @Post('signup')
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    return await this.accountsService.createAccount(createAccountDto);
  }

  @Post('signup/admin')
  async createAdminAccount(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    return await this.accountsService.createAdminAccount(createAccountDto);
  }

  @Post('signin')
  async loginAccount(@Body() loginAccountDto: LoginAccountDto): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    role: Role;
  }> {
    return await this.accountsService.loginAccount(loginAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async logoutAccount(
    @GetUser('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    return await this.accountsService.logoutAccount(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-email')
  async changeEmail(
    @GetUser('id') userId: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.changeEmailRequest(
      updateEmailDto,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-email')
  async updateEmail(
    @GetUser('id') userId: string,
    @Body('otp') otp: string,
  ): Promise<{ message: string }> {
    return await this.accountsService.changeEmailConfirm(userId, otp);
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.forgotPasswordRequest(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.resetPasswordConfirm(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@GetUser('id') userId: string) {
    return await this.accountsService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateAccount(@GetUser('id') userId: string, @Body() updateAccountDto: UpdateAccountDto) {
    return await this.accountsService.updateAccount(userId, updateAccountDto);
  }

  @Post('refresh-token')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.accountsService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.changePassword(userId, changePasswordDto);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return await this.accountsService.resendVerificationEmail(
      resendVerificationDto,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(
    @GetUser('id') userId: string,
  ): Promise<{ message: string }> {
    return await this.accountsService.deleteAccount(userId);
  }
}
