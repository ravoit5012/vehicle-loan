import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AgentModule } from './modules/agent/agent.module';
import { LoanTypesModule } from './modules/loan-types/loan-types.module';
import { LoanModule } from './modules/loan/loan.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/files',
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    CustomersModule,
    ManagerModule,
    AgentModule,
    LoanTypesModule,
    LoanModule,
    AnalyticsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
