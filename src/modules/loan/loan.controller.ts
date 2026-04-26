import { Controller, Get, Post, Body, Patch, Param, Delete, Req, NotFoundException, BadRequestException, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto, CompleteFeePaymentDto, PayEmiDto, AddPenaltyDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';
import type { Express } from 'express';  // Import `Express` as a type
import { memoryStorage } from 'multer';
import { FileFieldsInterceptor } from '@nestjs/platform-express';


@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) { }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  create(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    return this.loanService.createLoanApplication(createLoanDto, req.user);
  }

  @Get('get-all')
  getAll() {
    return this.loanService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-duplicate-vehicle')
  async checkDuplicateVehicle(@Body() dto: any) {
    return this.loanService.checkDuplicateVehicle(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/update-vehicle/:id')
  async updateVehicleDetails(@Param('id') loanId: string, @Req() req: any, @Body() dto: any) {
    return this.loanService.updateVehicleDetails(loanId, req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/update-info/:id')
  async updateLoanInfo(@Param('id') loanId: string, @Req() req: any, @Body() dto: any) {
    return this.loanService.updateLoanInfo(loanId, req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/verify-vehicle/:id')
  async verifyVehicleDetails(@Param('id') loanId: string, @Req() req: any) {
    return this.loanService.verifyVehicleDetails(loanId, req.user);
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
    return this.loanService.markCallVerified(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-contract/id/:id')
  async generateContract(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    try {
      return this.loanService.generateContract(loanId, req.user);
    } catch (error) {
      console.log(`Failed to generate contract: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-contract/id/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignedContract(
    @Param('id') loanId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.loanService.uploadSignedContract(loanId, file, req.user);
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
    return this.loanService.fieldVerifyLoan({
      loanId,
      files,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      user: req.user
    });
  }

@UseGuards(JwtAuthGuard)
@Post('/admin-approve/id/:id')
async adminApproveLoan(
  @Param('id') loanId: string,
  @Req() req: any,
  @Body('remark') remark: string
) {
  return this.loanService.adminApproveLoan(
    loanId,
    req.user,
    remark
  );
}


  @UseGuards(JwtAuthGuard)
  @Post('/reject/id/:id')
  async rejectLoan(
    @Param('id') loanId: string,
    @Req() req: any,
    @Body('remark') remark: string
  ) {
    return this.loanService.rejectLoan(loanId, req.user, remark);
  }


  @UseGuards(JwtAuthGuard)
  @Post('/disburse/id/:id')
  async disburseLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    return this.loanService.disburseLoan(loanId, req.user);
  }


  @UseGuards(JwtAuthGuard)
  @Post('/close/id/:id')
  async closeLoan(
    @Param('id') loanId: string,
    @Req() req: any
  ) {
    return this.loanService.closeLoan(
      loanId,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/id/:id')
  remove(@Param('id') id: string) {
    return this.loanService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get-all-fees')
  async getAllFees() {
    return this.loanService.getAllFees();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/collect-fees')
  @UseInterceptors(FileInterceptor('receipt', { storage: memoryStorage() }))
  async completeFeePayment(
    @UploadedFile() receipt: Express.Multer.File,
    @Body() body: CompleteFeePaymentDto,
  ) {
    if (!receipt) {
      throw new BadRequestException('Payment receipt is required');
    }
    const { id, loanId, paymentMethod, transactionId } = body;

    return this.loanService.completeFeePayment(
      id,
      loanId,
      paymentMethod,
      transactionId,
      receipt,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/all-repayments')
  async getAllRepayments() {
    return this.loanService.getAllRepayments();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/repayments/:loanId')
  async getRepayments(@Param('loanId') loanId: string) {
    return this.loanService.getRepayments(loanId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('repayment/pay/:loanId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'proof', maxCount: 1 }],
      { storage: memoryStorage() }
    )
  )
  async payEmi(
    @Param('loanId') loanId: string,
    @UploadedFiles() files: any,
    @Body() dto: PayEmiDto,
  ) {
    return this.loanService.payEmi(loanId, dto, files);
  }


  @UseGuards(JwtAuthGuard)
  @Post('repayment/penalty/:loanId')
  async addPenalty(
    @Param('loanId') loanId: string,
    @Body() dto: AddPenaltyDto,
  ) {
    return this.loanService.addPenalty(loanId, dto);
  }

}
