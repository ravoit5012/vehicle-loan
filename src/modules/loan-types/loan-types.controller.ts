// loan-type.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';

@Controller('loan-types')
export class LoanTypesController {
  constructor(private readonly loanTypeService: LoanTypesService) {}

  @Post('create')
  create(@Body() createLoanTypeDto: CreateLoanTypeDto) {
    return this.loanTypeService.create(createLoanTypeDto);
  }

  @Get('get-all')
  findAll() {
    return this.loanTypeService.findAll();
  }

  @Get('/id/:id')
  findOne(@Param('id') id: string) {
    return this.loanTypeService.findOne(id);
  }

  @Patch('/update/id/:id')
  update(@Param('id') id: string, @Body() updateLoanTypeDto: UpdateLoanTypeDto) {
    return this.loanTypeService.update(id, updateLoanTypeDto);
  }

  @Delete('/delete/id/:id')
  remove(@Param('id') id: string) {
    return this.loanTypeService.remove(id);
  }
}
