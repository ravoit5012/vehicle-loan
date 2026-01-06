import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }
  @Get('all')
  async getAllAgents() {
    return this.agentService.getAllAgents();
  }

  @Get('/id/:id')
  async getAgentById(@Param('id') id: string) {
    return this.agentService.getAgentById(id);
  }

  @Get('/manager/:managerId')
async getAgentsByManager(@Param('managerId') managerId: string) {
  return this.agentService.getAgentsByManager(managerId);
}

}
