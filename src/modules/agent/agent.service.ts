import { Injectable } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) { }
  async createAgent(dto: CreateAgentDto) {
    // Validate manager exists
    const manager = await this.prisma.manager.findUnique({
      where: { id: dto.managerId },
    });

    if (!manager) {
      throw new BadRequestException('Invalid managerId');
    }

    const existingPhone = await this.prisma.agent.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) {
      throw new BadRequestException('Phone number already in use by another agent');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      if (!dto.status) {
        dto.status = 'ACTIVE';
      }

      const agent = await this.prisma.agent.create({
        data: {
          ...dto,
          password: hashedPassword,
        },
      });

      return {
        message: 'Agent created successfully',
        agent,
      };
    } catch (err) {
      console.error('Error creating agent:', err);
      throw new BadRequestException(err.message);
    }
  }

  async getAllAgents() {
    return this.prisma.agent.findMany({
      // select: {
      //   id: true,
      //   name: true,
      //   email: true,
      // },
    });
  }

  async getAgentById(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async getAgentsByManager(managerId: string) {
    return this.prisma.agent.findMany({
      where: { managerId },
      select: { id: true, name: true, email: true },
    });
  }

  async updateAgent(id: string, dto: UpdateAgentDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const updateData: any = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.managerId) {
      const manager = await this.prisma.manager.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new BadRequestException('Invalid managerId');
      }
    }

    return this.prisma.agent.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    await this.prisma.agent.delete({
      where: { id },
    });

    return {
      message: 'Agent deleted successfully',
    };
  }
}
