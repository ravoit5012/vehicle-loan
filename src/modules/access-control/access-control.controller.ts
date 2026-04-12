import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/role-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Role as PrismaRole, LoanApplicationStatus } from '@prisma/client';
import { IsEnum, IsArray, IsString } from 'class-validator';

class UpdateAccessDto {
  @IsString()
  role: PrismaRole;

  @IsArray()
  @IsString({ each: true })
  allowedStatuses: LoanApplicationStatus[];
}

@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllAccessConfigs() {
    return this.accessControlService.getAllAccessConfigs();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateAccessConfig(@Body() body: UpdateAccessDto) {
    return this.accessControlService.updateAccessConfig(body.role, body.allowedStatuses);
  }
}
