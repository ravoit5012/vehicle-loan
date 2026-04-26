import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';
import { Role } from '@prisma/client';

@Injectable()
export class LoanTypesService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(createLoanTypeDto: CreateLoanTypeDto, user: any) {
    try {
      if (user?.role === 'MANAGER') {
        createLoanTypeDto.status = 'NOT_APPROVED';
      }

      const loanType = await this.prisma.loanType.create({
        data: createLoanTypeDto,
      });
      return { message: 'Loan type created successfully' };
    } catch (error) {
      throw new Error(`Failed to create loan type: ${error.message}`);
    }
  }

  async findAll() {
    return this.prisma.loanType.findMany();
  }

  async findOne(id: string) {
    const loanType = await this.prisma.loanType.findUnique({
      where: { id },
    });
    if (!loanType) throw new NotFoundException('Loan type not found');
    return loanType;
  }

  async update(id: string, updateLoanTypeDto: UpdateLoanTypeDto, user: any) {
    try {
      const exists = await this.prisma.loanType.findUnique({ where: { id } });
      if (!exists) throw new NotFoundException('Loan type not found');

      if (user?.role === 'MANAGER') {
        updateLoanTypeDto.status = 'NOT_APPROVED';
      }

      const updatedLoanType = await this.prisma.loanType.update({
        where: { id },
        data: updateLoanTypeDto,
      });
      return { message: 'Loan type updated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
    }
  }

  async remove(id: string) {
    try {
      const exists = await this.prisma.loanType.findUnique({ where: { id } });
      if (!exists) throw new NotFoundException('Loan type not found');

      await this.prisma.loanType.delete({ where: { id } });
      return { message: 'Loan type deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
    }
  }
}
