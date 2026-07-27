import { Get, Body, Controller, Post, Put, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/role-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthService } from './auth.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Role } from 'src/common/enums/role.enum';
import { constantValues } from 'src/common/constants';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private prisma: PrismaService) { }


  @Post('login')
  async login(
    @Body() body: { username: string; password: string; role: Role },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { username, password, role } = body;


      const { token, user } = await this.authService.login(
        username,
        password,
        role,
      );

      res.cookie('loginToken', token, {
        httpOnly: true,
        secure: process.env.ENVIRONMENT === 'development',
        sameSite: 'lax',
        // maxAge: 24 * 60 * 60 * 1000,
        maxAge: constantValues.jwtExpiry,
      });

      return {
        message: 'Logged in successfully',
        user,
      };
    } catch (error) {
        console.log('Login Controller error:', error);
        throw error;
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('loginToken');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboard(@Req() req) {
    return { user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('update-password')
  async updatePassword(
    @Req() req,
    @Body() dto: UpdatePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.updateAdminPassword(
      req.user.id,
      dto.password,
      dto.confirmPassword,
    );

    res.cookie('loginToken', token, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'development',
      sameSite: 'lax',
      maxAge: constantValues.jwtExpiry,
    });

    return {
      message: 'Password updated successfully',
      user,
    };
  }
}
