import { Controller, Get, Post, Body, Patch, Param, Delete, Req, NotFoundException, BadRequestException, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';
import type { Express } from 'express';  // Import `Express` as a type


@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) { }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  create(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    return this.loanService.createLoanApplication(createLoanDto);
  }

  @Get('get-all')
  getAll() {
    return this.loanService.getAll();
  }

  @Get('/id/:id')
  async getLoanApplicationById(
    @Param('id') id: string
  ) {
    const loan = await this.loanService.getById(id);
    if (!loan) throw new NotFoundException('Loan application not found');
    return loan;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/call-verified/id/:id')
  async markCallVerified(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const managerId = req.user.id;
    return this.loanService.markCallVerified(id, managerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-contract/id/:id')
  async generateContract(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    const managerId = req.user.id;
    return this.loanService.generateContract(loanId, managerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-contract/id/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignedContract(
    @Param('id') loanId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.id;
    return this.loanService.uploadSignedContract(loanId, file, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/field-verify/id/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async fieldVerifyLoan(
    @Param('id') loanId: string,
    @Req() req: any,
    latitude,
    longitude,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const agentId = req.user.id;
    return this.loanService.fieldVerifyLoan({
      loanId,
      files,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      agentId
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/admin-approve/id/:id')
  async adminApproveLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    const adminId = req.user.id;
    return this.loanService.adminApproveLoan(loanId, adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/disburse/id/:id')
  async disburseLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    return this.loanService.disburseLoan(loanId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/reject/id/:id')
  async rejectLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    const adminId = req.user.id;
    return this.loanService.rejectLoan(
      loanId,
      req.body.rejectionRemarks
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/close/id/:id')
  async closeLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    return this.loanService.closeLoan(
      loanId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/id/:id')
  remove(@Param('id') id: string) {
    return this.loanService.remove(id);
  }
}
