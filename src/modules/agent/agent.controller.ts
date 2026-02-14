import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,Request as Req } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { ForbiddenException } from '@nestjs/common';


@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService, private prisma: PrismaService) { }

  @Post('')
  create(@Body() dto: CreateAgentDto) {
    try {
      return this.agentService.createAgent(dto);
    } catch (error) {
      console.log('Error creating agent:', error);
      throw error;
    }
  }

  @Get('all')
  async getAllAgents() {
    return this.agentService.getAllAgents();
  }

  @Get('/id/:id')
  async getAgentById(@Param('id') id: string) {
    return this.agentService.getAgentById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/approve/id/:id')
  async approveAgent(
    @Param('id') id: string,
    @Req() req
  ) {
    const user = req.user as any;

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed for this action');
    }

    return this.prisma.agent.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  @Get('/manager/:managerId')
  async getAgentsByManager(@Param('managerId') managerId: string) {
    return this.agentService.getAgentsByManager(managerId);
  }

  @Post('update/id/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentService.updateAgent(id, dto);
  }

  @Delete('delete/id/:id')
  delete(@Param('id') id: string) {
    return this.agentService.deleteAgent(id);
  }

}
