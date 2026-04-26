import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/role-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('loan-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoanTypesController {
  constructor(private readonly loanTypeService: LoanTypesService) {}

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('create')
  create(@Body() createLoanTypeDto: CreateLoanTypeDto, @Req() req: any) {
    return this.loanTypeService.create(createLoanTypeDto, req.user);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Get('get-all')
  findAll() {
    return this.loanTypeService.findAll();
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.AGENT)
  @Get('/id/:id')
  findOne(@Param('id') id: string) {
    return this.loanTypeService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('/update/id/:id')
  update(@Param('id') id: string, @Body() updateLoanTypeDto: UpdateLoanTypeDto, @Req() req: any) {
    return this.loanTypeService.update(id, updateLoanTypeDto, req.user);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('/delete/id/:id')
  remove(@Param('id') id: string) {
    return this.loanTypeService.remove(id);
  }
}
