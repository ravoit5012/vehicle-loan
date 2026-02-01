import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) { }

  async createManager(createManagerDto: CreateManagerDto) {
    const { password, managerCode, ...rest } = createManagerDto as any;

    const existingUser = await this.prisma.manager.findUnique({ where: { username: createManagerDto.username } });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    let codeToUse = managerCode;
    if (!codeToUse) {
      codeToUse = await this.generateUniqueManagerCode(createManagerDto.name, createManagerDto.phoneNumber);
    } else {
      const existingCode = await this.prisma.manager.findUnique({ where: { managerCode: codeToUse } });
      if (existingCode) {
        throw new Error('Manager code already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const data: Prisma.ManagerCreateInput = {
        name: createManagerDto.name,
        managerCode: createManagerDto.managerCode,
        phoneNumber: createManagerDto.phoneNumber,
        username: createManagerDto.username,
        password: hashedPassword,
        email: createManagerDto.email,
        status: 'ACTIVE',
        address: createManagerDto.address,
        city: createManagerDto.city,
        pincode: createManagerDto.pincode,
      };

      const created = await this.prisma.manager.create({
        data,
      });

      const { password: _, ...safe } = created;
      return safe;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create manager');
    }
  }

  private async generateUniqueManagerCode(name: string, phone: string) {
    if (!name || !phone) return '';
    const namePart = name.substring(0, 4).toUpperCase(); // first 4 letters of name
    const phonePart = phone.substring(3, 8); // 4th to 8th digits of phone
    return `MGR-${namePart}-${phonePart}`;
    throw new InternalServerErrorException('Failed to generate unique manager code');
  }

  async getAllManagers() {
    return this.prisma.manager.findMany({
      // select: {
      //   id: true,
      //   name: true,
      //   managerCode: true,
      //   phoneNumber: true,
      // },
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

  async updateManager(id: string, dto: UpdateManagerDto) {
    const manager = await this.prisma.manager.findUnique({
      where: { id },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // Handle password hashing if password is provided
    let updateData: any = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    try {
      const updated = await this.prisma.manager.update({
        where: { id },
        data: updateData,
      });

      return {
        message: 'Manager updated successfully',
        manager: updated,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteManager(id: string) {
    const manager = await this.prisma.manager.findUnique({
      where: { id },
    });
    const agents = await this.prisma.agent.count({ where: { managerId: id } });
    if (agents > 0) throw new BadRequestException('Manager has agents assigned');

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    await this.prisma.manager.delete({
      where: { id },
    });

    return {
      message: 'Manager deleted successfully',
    };
  }
}
