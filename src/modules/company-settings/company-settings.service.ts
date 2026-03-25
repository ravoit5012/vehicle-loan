import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

const REDIS_KEY = 'company-settings';

@Injectable()
export class CompanySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSettings() {
    // 1. Try cache first
    const cached = await this.redis.get(REDIS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fallback to DB
    const settings = await this.prisma.companySettings.findFirst();
    if (settings) {
      await this.redis.set(REDIS_KEY, JSON.stringify(settings));
    }

    return settings;
  }

  async updateSettings(dto: UpdateCompanySettingsDto) {
    // Upsert: create if not exists, update if exists
    const existing = await this.prisma.companySettings.findFirst();

    let settings;
    if (existing) {
      settings = await this.prisma.companySettings.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      settings = await this.prisma.companySettings.create({
        data: {
          companyName: dto.companyName || '',
          companyEmail: dto.companyEmail || '',
          companyPhone: dto.companyPhone || '',
          companyAddress: dto.companyAddress || '',
          panNumber: dto.panNumber || '',
        },
      });
    }

    // Invalidate cache and re-set
    await this.redis.del(REDIS_KEY);
    await this.redis.set(REDIS_KEY, JSON.stringify(settings));

    return { message: 'Company settings updated successfully', settings };
  }
}
