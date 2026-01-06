import { Injectable } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) { }
  
    async getAllAgents() {
      return this.prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
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
}
