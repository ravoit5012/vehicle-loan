import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: constantValues.jwtSecret,
      signOptions: { expiresIn: constantValues.jwtExpiry },
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
