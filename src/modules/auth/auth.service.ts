import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';
import { constantValues } from 'src/common/constants';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) { }

  async validateUser(username: string, password: string, role: Role) {
    let user: any;

    if (role === Role.ADMIN) {
      user = await this.prisma.admin.findUnique({ where: { username } });
    } else if (role === Role.MANAGER) {
      user = await this.prisma.manager.findUnique({ where: { username } });
    } else if (role === Role.AGENT) {
      user = await this.prisma.agent.findUnique({ where: { username } });
    }

    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    return user;
  }



  async login(username: string, password: string, role: Role) {
    try {
      const user = await this.validateUser(username, password, role);

      let updatedUser;

      switch (role) {
        case Role.MANAGER:
          updatedUser = await this.prisma.manager.update({
            where: { id: user.id },
            data: { tokenVersion: { increment: 1 } },
          });
          break;

        case Role.ADMIN:
          updatedUser = await this.prisma.admin.update({
            where: { id: user.id },
            data: { tokenVersion: { increment: 1 } },
          });
          break;

        case Role.AGENT:
          updatedUser = await this.prisma.agent.update({
            where: { id: user.id },
            data: { tokenVersion: { increment: 1 } },
          });
          break;
      }

      // 🔥 Use updatedUser here, NOT old user
      const payload = {
        sub: updatedUser.id,
        username: updatedUser.username,
        role,
        tokenVersion: updatedUser.tokenVersion,
      };

      const token = this.jwtService.sign(payload, {
        secret: constantValues.jwtSecret,
        expiresIn: constantValues.jwtExpiry,
      });

      const { password: _, ...safeUser } = updatedUser;

      return { token, user: safeUser };
    } catch (error) {
      console.log('Login error:', error);
      throw new UnauthorizedException(error.message);
    }
  }


}
