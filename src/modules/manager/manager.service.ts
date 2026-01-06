import { Injectable } from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) { }

  async getAllManagers() {
    return this.prisma.manager.findMany({
      select: {
        id: true,
        name: true,
        managerCode: true,
        phoneNumber: true,
      },
    });
  }

  async getManagerById(id: string) {
    const manager = await this.prisma.manager.findUnique({
      where: { id },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager;
  }
}
