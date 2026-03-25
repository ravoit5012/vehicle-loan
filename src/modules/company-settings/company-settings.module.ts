import { Module } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsController } from './company-settings.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService, PrismaService, JwtService],
})
export class CompanySettingsModule {}
