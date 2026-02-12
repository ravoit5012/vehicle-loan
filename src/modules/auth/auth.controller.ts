import { Get, Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { AuthService } from './auth.service';
import { Role } from 'src/common/enums/role.enum';
import { constantValues } from 'src/common/constants';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string; role: Role },
    @Res({ passthrough: true }) res: Response,
  ) {
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
}
