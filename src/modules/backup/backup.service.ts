import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  async exportDatabase() {
    try {
      const [
        admins,
        managers,
        agents,
        customers,
        loanTypes,
        loanApplications,
        loanFees,
        companySettings,
      ] = await Promise.all([
        this.prisma.admin.findMany(),
        this.prisma.manager.findMany(),
        this.prisma.agent.findMany(),
        this.prisma.customer.findMany(),
        this.prisma.loanType.findMany(),
        this.prisma.loanApplication.findMany(),
        this.prisma.loanFees.findMany(),
        this.prisma.companySettings.findMany(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        version: "1.0",
        collections: {
          admins,
          managers,
          agents,
          customers,
          loanTypes,
          loanApplications,
          loanFees,
          companySettings,
        },
      };
    } catch (error) {
      console.error('Export Error:', error);
      throw new BadRequestException('Failed to export database');
    }
  }

  async importDatabase(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No backup file provided');
    }

    try {
      const backupData = JSON.parse(file.buffer.toString('utf-8'));
      
      if (!backupData.collections || !backupData.version) {
        throw new BadRequestException('Invalid backup file format');
      }

      const { collections } = backupData;

      // Restoring requires deleting existing data inside a transaction if possible.
      // Since MongoDB transactions require replica sets, we do sequential clearing carefully.
      // Deletion Order (dependents first):
      await this.prisma.loanFees.deleteMany({});
      await this.prisma.loanApplication.deleteMany({});
      await this.prisma.customer.deleteMany({});
      await this.prisma.agent.deleteMany({});
      await this.prisma.manager.deleteMany({});
      await this.prisma.admin.deleteMany({});
      await this.prisma.loanType.deleteMany({});
      await this.prisma.companySettings.deleteMany({});

      // Creation Order (dependencies first):
      if (collections.admins?.length > 0) await this.prisma.admin.createMany({ data: collections.admins });
      if (collections.companySettings?.length > 0) await this.prisma.companySettings.createMany({ data: collections.companySettings });
      if (collections.loanTypes?.length > 0) await this.prisma.loanType.createMany({ data: collections.loanTypes });
      if (collections.managers?.length > 0) await this.prisma.manager.createMany({ data: collections.managers });
      if (collections.agents?.length > 0) await this.prisma.agent.createMany({ data: collections.agents });
      if (collections.customers?.length > 0) await this.prisma.customer.createMany({ data: collections.customers });
      if (collections.loanApplications?.length > 0) await this.prisma.loanApplication.createMany({ data: collections.loanApplications });
      if (collections.loanFees?.length > 0) await this.prisma.loanFees.createMany({ data: collections.loanFees });

      return {
        success: true,
        message: 'Database restored successfully from backup',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Import Error:', error);
      throw new BadRequestException(error.message || 'Failed to import backup file');
    }
  }
}
