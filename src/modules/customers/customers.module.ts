import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: constantValues.jwtSecret,
      signOptions: { expiresIn: constantValues.jwtExpiry },
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports:[CustomersService]
})
export class CustomersModule { }
