import { Module } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { LoanTypesController } from './loan-types.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: constantValues.jwtSecret,
      signOptions: { expiresIn: constantValues.jwtExpiry },
    }),
  ],
  controllers: [LoanTypesController],
  providers: [LoanTypesService, PrismaService],
})
export class LoanTypesModule { }