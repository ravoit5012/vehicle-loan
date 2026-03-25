import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { constantValues } from 'src/common/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: constantValues.jwtSecret,
      signOptions: { expiresIn: constantValues.jwtExpiry },
    }), PrismaModule
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule { }
