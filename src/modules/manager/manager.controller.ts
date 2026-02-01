import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) { }

  @Post()
  async create(@Body() createManagerDto: CreateManagerDto) {
    return this.managerService.createManager(createManagerDto);
  }

  @Get('all')
  async getAllManagers() {
    return this.managerService.getAllManagers();
  }

  @Get('/id/:id')
  async getManagerById(@Param('id') id: string) {
    return this.managerService.getManagerById(id);
  }

  @Patch('update/id/:id')
  async updateManager(
    @Param('id') id: string,
    @Body() dto: UpdateManagerDto,
  ) {
    return this.managerService.updateManager(id, dto);
  }

  @Delete('delete/id/:id')
  async deleteManager(@Param('id') id: string) {
    return this.managerService.deleteManager(id);
  }
}
