import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserAccountDto } from './dto/user-account.dto';
import { Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LoginAccountDto } from './dto/login-account.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateEmailDto } from './dto/update-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-otp.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

@Injectable()
export class AccountsService {
  private readonly saltRounds = 10;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //   create account method
  async createAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    const { email, password, role, firstName, lastName } = createAccountDto;

    try {
      if (
        role !== Role.ADMIN &&
        role !== Role.BUSINESS_OWNER &&
        role !== Role.BUYER
      ) {
        throw new BadRequestException('Invalid role');
      }

      // check existing user
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) throw new BadRequestException('User already exists');

      const hashPassword = await this.hashPassword(password);

      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, this.saltRounds);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const data = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            username,
            email,
            password: hashPassword,
            role,
            firstName,
            lastName,
            emailVerified: false,
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePictureUrl: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!newUser)
          throw new InternalServerErrorException(
            'Failed to create account. Please try again',
          );
        await tx.emailVerificationToken.create({
          data: {
            userId: newUser.id,
            token: hashedOtp,
            expiresAt,
          },
        });

        await tx.outbox.create({
          data: {
            topic: 'user.registered',
            payload: {
              userId: newUser.id,
              email: newUser.email,
              username: newUser.username,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role,
              emailVerified: newUser.emailVerified,
              otp,
              createdAt: newUser.createdAt,
              updatedAt: newUser.updatedAt,
              loggedAt: new Date(),
            },
          },
        });

        return newUser;
      });

      return { message: 'Registration successful', data };
    } catch (error) {
      console.error(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Internal Server Error. Please try again',
      );
    }
  }

  async createAdminAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    const { email, password, firstName, lastName } = createAccountDto;

    const role = Role.ADMIN;

    return await this.createAccount({
      email,
      password,
      role,
      firstName,
      lastName,
    });
  }

  // login account methodq
  async loginAccount(loginAccountDto: LoginAccountDto): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    role: Role;
  }> {
    const { email, password } = loginAccountDto;

    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new NotFoundException('User not found');

      const comparePassword = await bcrypt.compare(password, user.password);
      if (!comparePassword)
        throw new NotFoundException('Invalid credentials. Please try again');

      // create user session
      const session = await this.prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      };

      const accessToken = await this.generateAccessToken(payload);
      const refreshToken = await this.generateRefreshToken(payload);

      if (!accessToken && !refreshToken)
        throw new InternalServerErrorException(
          'Failed to login. Please try again',
        );

      const hashedRefreshToken = await bcrypt.hash(
        refreshToken,
        this.saltRounds,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.session.update({
          where: { id: session.id },
          data: {
            refreshToken: hashedRefreshToken,
          },
        });

        await tx.outbox.create({
          data: {
            topic: 'user.loggedIn',
            payload: {
              userId: user.id,
              email: user.email,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              sessionId: session.id,
              loggedAt: new Date(),
            },
          },
        });
      });

      return {
        message: 'Login successful',
        accessToken,
        refreshToken,
        role: user.role,
      };
    } catch (error) {
      console.error(error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Internal Server Error. Please try again',
      );
    }
  }

  // logout account method
  async logoutAccount(sessionId: string): Promise<{ message: string }> {
    if (!sessionId) throw new BadRequestException('Session ID is required');

    await this.prisma.$transaction(async (tx) => {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) throw new NotFoundException('User session not found');

      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) throw new NotFoundException('User not found');

      await tx.session.delete({
        where: { id: sessionId },
      });

      await tx.outbox.create({
        data: {
          topic: 'user.loggedOut',
          payload: {
            userId: user.id,
            sessionId: session.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified,
            loggedAt: new Date(),
          },
        },
      });
    });

    return { message: 'Logout successful' };
  }

  // update account method
  async updateAccount(
    userId: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    const { permanentAddress } = updateAccountDto;

    if (!permanentAddress)
      throw new BadRequestException('Permanent address is required');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateAccountDto,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          emailVerified: true,
          permanentAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    });
    return {
      message: 'Account updated successfully',
      data: updatedUser as unknown as UserAccountDto,
    };
  }

  // update profile picture method
  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      let uploadedImage: string | null = null;
      let imagePublicId: string | null = null;

      try {
        if (file) {
          const uploadImage = await this.cloudinaryService.uploadProfilePicture(
            file,
            user.id,
          );

          imagePublicId = uploadImage.publicId;
          uploadedImage = uploadImage.url;

          if (uploadImage) {
            const updatedUser = await tx.user.update({
              where: { id: userId },
              data: {
                profilePictureUrl: uploadedImage,
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                emailVerified: true,
                permanentAddress: true,
                profilePictureUrl: true,
                createdAt: true,
                updatedAt: true,
              },
            });

            return updatedUser;
          }
        }
      } catch (error) {
        if (imagePublicId) {
          await this.cloudinaryService.deleteAsset(imagePublicId, 'image');
        }
        throw new InternalServerErrorException(
          'Failed to upload profile picture',
        );
      }
    });
    return {
      message: 'Account profile picture updated successfully',
    };
  }

  // change email request method
  async changeEmailRequest(
    updateEmailDto: UpdateEmailDto,
    userId: string,
  ): Promise<{ message: string }> {
    const { currentEmail, newEmail } = updateEmailDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email !== currentEmail)
      throw new BadRequestException('Current email is incorrect');

    const existingMail = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existingMail) throw new BadRequestException('Email is already in use');

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    const hashedOtp = await bcrypt.hash(otp, this.saltRounds);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.emailUpdateToken.deleteMany({ where: { userId } });

      await tx.emailUpdateToken.create({
        data: {
          userId,
          token: hashedOtp,
          newEmail,
          expiresAt,
        },
      });

      await tx.outbox.create({
        data: {
          topic: 'user.emailChangeRequested',
          payload: {
            userId: user.id,
            oldEmail: user.email,
            newEmail: newEmail,
            otp: otp,
            requestedAt: new Date(),
          },
        },
      });
    });

    return {
      message:
        'Email change request initialized. Please check your email for the OTP',
    };
  }

  // change email confirm method
  async changeEmailConfirm(
    userId: string,
    otp: string,
  ): Promise<{ message: string }> {
    if (!otp) throw new BadRequestException('OTP is required');

    const pendingRequest = await this.prisma.emailUpdateToken.findFirst({
      where: { userId },
    });

    if (!pendingRequest)
      throw new BadRequestException('No pending email change request found');

    if (pendingRequest.expiresAt < new Date()) {
      await this.prisma.emailUpdateToken.delete({
        where: { id: pendingRequest.id },
      });
      throw new BadRequestException('OTP has expired');
    }

    const isValid = await bcrypt.compare(otp, pendingRequest.token);
    if (!isValid) throw new BadRequestException('Invalid OTP');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          email: pendingRequest.newEmail,
        },
      });

      await tx.emailUpdateToken.delete({ where: { id: pendingRequest.id } });

      await tx.outbox.create({
        data: {
          topic: 'user.emailChangedSuccessfully',
          payload: {
            userId,
            newEmail: pendingRequest.newEmail,
            emailVerified: true,
            changedAt: new Date(),
          },
        },
      });
    });

    return { message: 'Email changed successfully' };
  }

  // forgot password request method
  async forgotPasswordRequest(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, this.saltRounds);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });

        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            token: hashedOtp,
            expiresAt,
          },
        });

        await tx.outbox.create({
          data: {
            topic: 'user.passwordResetRequested',
            payload: {
              userId: user.id,
              email: user.email,
              otp: otp,
              requestedAt: new Date(),
            },
          },
        });
      });
    }

    return {
      message:
        'If an account with that email exists, we have sent a password reset code.',
    };
  }

  // reset password confirm method
  async resetPasswordConfirm(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, otp, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const pendingRequest = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
    });

    if (!pendingRequest) {
      throw new BadRequestException('No pending password reset request found');
    }

    if (pendingRequest.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { id: pendingRequest.id },
      });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isValid = await bcrypt.compare(otp, pendingRequest.token);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      await tx.passwordResetToken.delete({ where: { id: pendingRequest.id } });

      await tx.outbox.create({
        data: {
          topic: 'user.passwordChangedSuccessfully',
          payload: {
            userId: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            changedAt: new Date(),
          },
        },
      });
    });

    return {
      message: 'Password has been reset successfully. You can now log in.',
    };
  }

  // get profile method
  async getProfile(
    userId: string,
  ): Promise<{ message: string; data: UserAccountDto }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        permanentAddress: true,
        profilePictureUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return { message: 'User profile retrieved successfully', data: user };
  }

  // refresh token method
  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.refreshToken !== refreshToken)
        throw new UnauthorizedException('Invalid or revoked refresh session');

      const newAccessToken = this.jwtService.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '1h' },
      );

      const newRefreshToken = this.jwtService.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      );

      await this.prisma.session.update({
        where: { id: payload.sessionId },
        data: { refreshToken: newRefreshToken },
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // change password method
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new BadRequestException('Current password is incorrect');

    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      await tx.session.deleteMany({ where: { userId } });

      await tx.outbox.create({
        data: {
          topic: 'user.passwordChangedSuccessfully',
          payload: {
            userId: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            changedAt: new Date(),
          },
        },
      });
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // verify email method
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const { otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { id: verifyEmailDto.userId },
    });
    if (!user) throw new BadRequestException('Invalid request');

    if (user.emailVerified)
      throw new BadRequestException('Email is already verified');

    const pendingVerification =
      await this.prisma.emailVerificationToken.findFirst({
        where: { userId: user.id },
      });

    if (!pendingVerification)
      throw new BadRequestException(
        'No pending email verification request found',
      );

    if (pendingVerification.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({
        where: { id: pendingVerification.id },
      });
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isValid = await bcrypt.compare(otp, pendingVerification.token);
    if (!isValid) throw new BadRequestException('Invalid OTP');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      await tx.emailVerificationToken.delete({
        where: { id: pendingVerification.id },
      });

      await tx.outbox.create({
        data: {
          topic: 'user.emailVerified',
          payload: {
            userId: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            verifiedAt: new Date(),
          },
        },
      });
    });

    return { message: 'Email verified successfully' };
  }

  // resend verification email method
  async resendVerificationEmail(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const { email } = resendVerificationDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found');

    if (user.emailVerified === true)
      throw new BadRequestException('Email is already verified');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, this.saltRounds);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: hashedOtp,
          expiresAt,
        },
      });

      await tx.outbox.create({
        data: {
          topic: 'user.verificationEmailResent',
          payload: {
            userId: user.id,
            email: user.email,
            username: user.username,
            otp: otp,
            requestedAt: new Date(),
          },
        },
      });
    });

    return {
      message:
        'Otp has been resent. Please check your email for the verification code',
    };
  }

  // delete account method
  async deleteAccount(userId: string): Promise<{ message: string }> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      await tx.outbox.create({
        data: {
          topic: 'user.accountDeleted',
          payload: {
            userId: user.id,
            email: user.email,
            deletedAt: new Date(),
          },
        },
      });

      await tx.session.deleteMany({ where: { userId } });
      await tx.emailUpdateToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    return { message: 'Your account has been permanently deleted.' };
  }

  private async hashPassword(password: string): Promise<string> {
    const hashPwd = await bcrypt.hash(password, this.saltRounds);

    if (!hashPwd) throw new Error('Data processing error. Please try again');
    return hashPwd;
  }

  private async generateAccessToken(payload: any): Promise<string> {
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    });
    return token;
  }
  private async generateRefreshToken(payload: {}): Promise<string> {
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return token;
  }
}
