import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret)
      throw new Error(
        'JWT_ACCESS_SECRET is not defined in the environment variables',
      );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    id: string;
    username: string;
    email: string;
    role: Role;
    sessionId: string;
  }) {
    const session = await this.prisma.session.findUnique({
      where: {
        id: payload.sessionId,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        HttpStatus.UNAUTHORIZED,
        'Session expired',
      );
    }
    return { ...session.user, sessionId: session.id };
  }
}
