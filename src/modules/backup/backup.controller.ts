import { Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { RolesGuard } from 'src/common/guards/role-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response, Express } from 'express';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // ONLY ADMINS
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  async exportDatabase(@Res() res: Response) {
    const data = await this.backupService.exportDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json"`);
    return res.send(data);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importDatabase(@UploadedFile() file: Express.Multer.File) {
    return this.backupService.importDatabase(file);
  }
}
