import { Module } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { LoanTypesController } from './loan-types.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [LoanTypesController],
  providers: [LoanTypesService, PrismaService],
})

export class LoanTypesModule {}