import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { constants } from 'src/common/constants';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['loginToken'];

    if (!token) {
      throw new UnauthorizedException('No token found');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: constants.jwtSecret,
      });

      const { sub, role } = payload;

      let user: any;

      switch (role) {
        case 'ADMIN':
          user = await this.prisma.admin.findUnique({
            where: { id: sub },
          });
          break;

        case 'MANAGER':
          user = await this.prisma.manager.findUnique({
            where: { id: sub },
            include: { agents: true },
          });
          break;

        case 'AGENT':
          user = await this.prisma.agent.findUnique({
            where: { id: sub },
            include: { manager: true },
          });
          break;

        default:
          throw new UnauthorizedException('Invalid role');
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach full user object + role
      request.user = {
        ...user,
        role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
