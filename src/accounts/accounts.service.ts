import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserAccountDto } from './dto/user-account.dto';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LoginAccountDto } from './dto/login-account.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccountsService {
  private readonly saltRounds = 10;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  //   create account method
  async createAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<{ message: string; data: UserAccountDto }> {
    const { email, password, role, firstName, lastName } = createAccountDto;
    if (!email || !password || !role || !firstName || !lastName) {
      throw new Error('All fields are required');
    }

    try {
      if (role !== Role.BUSINESS_OWNER && role !== Role.BUYER)
        throw new BadRequestException(
          "Invalid role. Role must be either 'BUSINESS_OWNER' or 'BUYER'",
        );

      // check existing user
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) throw new BadRequestException('User already exists');

      const hashPassword = await this.hashPassword(password);

      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
      const data = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            username,
            email,
            password: hashPassword,
            role,
            firstName,
            lastName,
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePictureUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!newUser)
          throw new InternalServerErrorException(
            'Failed to create account. Please try again',
          );

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

  async loginAccount(
    loginAccountDto: LoginAccountDto,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { email, password } = loginAccountDto;
    if (!email || !password) throw new Error('All fields are required');

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

      return { message: 'Login successful', accessToken, refreshToken };
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

  private async hashPassword(password: string): Promise<string> {
    const hashPwd = await bcrypt.hash(password, this.saltRounds);

    if (!hashPwd) throw new Error('Data processing error. Please try again');
    return hashPwd;
  }

  private async generateAccessToken(payload: any): Promise<string> {
    const token = await this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    });
    return token;
  }
  private async generateRefreshToken(payload: {}): Promise<string> {
    const token = await this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    return token;
  }
}
