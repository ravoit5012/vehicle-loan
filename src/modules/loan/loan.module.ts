import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [JwtModule.register({
    secret: constantValues.jwtSecret,
    signOptions: { expiresIn: constantValues.jwtExpiry },
  }),],
  controllers: [LoanController],
  providers: [LoanService],
})
export class LoanModule { }
