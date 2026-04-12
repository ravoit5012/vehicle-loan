import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Global()
@Module({
  imports: [JwtModule.register({
    secret: constantValues.jwtSecret,
    signOptions: { expiresIn: constantValues.jwtExpiry },
  })],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule { }
