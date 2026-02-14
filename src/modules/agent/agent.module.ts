import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: constantValues.jwtSecret,
      signOptions: { expiresIn: constantValues.jwtExpiry },
    }),
  ],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule { }
