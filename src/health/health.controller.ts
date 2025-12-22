import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get('/get')
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @Post('/set')
  setHealth(@Body('status') status: string) {
    return this.healthService.setHealth(status);
  }
}
