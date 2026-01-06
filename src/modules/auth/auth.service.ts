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


  // async login(username: string, password: string, role: Role) {
  //   const user = await this.validateUser(username, password, role);
  //   const payload = { username: user.username, role, sub: user.id || 0 };

  //   const token = this.jwtService.sign(payload, {
  //     secret: constants.jwtSecret,
  //     expiresIn: '1d',
  //   });

  //   return token;
  // }

  // auth.service.ts
async login(username: string, password: string, role: Role) {
  const user = await this.validateUser(username, password, role);

  const payload = {
    sub: user.id,
    username: user.username,
    role: role,
  };

  const token = this.jwtService.sign(payload, {
    secret: constantValues.jwtSecret,
    expiresIn: constantValues.jwtExpiry,
  });

  // IMPORTANT: never return password
  const { password: _, ...safeUser } = user;

  return {
    token,
    user: safeUser,
  };
}


}
