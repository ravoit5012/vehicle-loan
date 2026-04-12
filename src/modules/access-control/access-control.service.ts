import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllAccessConfigs() {
    const configs = await this.prisma.roleAccess.findMany();
    // Default structure if not defined
    const roles: Role[] = ['AGENT', 'MANAGER'];
    const result: any[] = [];

    for (const role of roles) {
      const config = configs.find((c) => c.role === role);
      if (config) {
        result.push(config);
      } else {
        result.push({ role, allowedStatuses: [] });
      }
    }
    return result;
  }

  async updateAccessConfig(role: Role, allowedStatuses: LoanApplicationStatus[]) {
    return this.prisma.roleAccess.upsert({
      where: { role },
      update: { allowedStatuses },
      create: { role, allowedStatuses },
    });
  }

  async checkAccess(userRole: string, targetStatus: LoanApplicationStatus): Promise<void> {
    if (userRole === 'ADMIN') {
      return; // Admin bypasses these checks and has complete control
    }

    const config = await this.prisma.roleAccess.findUnique({
      where: { role: userRole as Role },
    });

    if (!config || !config.allowedStatuses.includes(targetStatus)) {
      throw new ForbiddenException(`Your role (${userRole}) is not authorized to update loan applications to status: ${targetStatus}. Please contact the administrator.`);
    }
  }
}
