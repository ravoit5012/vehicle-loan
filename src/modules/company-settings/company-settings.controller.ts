import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/role-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) { }

  @Get()
  getSettings() {
    return this.companySettingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateSettings(@Body() dto: UpdateCompanySettingsDto) {
    return this.companySettingsService.updateSettings(dto);
  }
}
