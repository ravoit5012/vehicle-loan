import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/all-loan-count')
  findAll(@Req() req: any) {
    return this.analyticsService.countAllLoans(req.user);
  }
  @Get('/all-loan-type-count')
  findAllLoanTypes() {
    return this.analyticsService.countAllLoanTypes();
  }
  @Get('/all-approved-loan-count')
  findAllApproved(@Req() req: any) {
    return this.analyticsService.countApprovedLoans(req.user);
  }
  @Get('/all-rejected-loan-count')
  findAllRejected(@Req() req: any) {
    return this.analyticsService.countRejectedLoans(req.user);
  }
  @Get('/total-principal-amount')
  totalPrincipalAmount(@Req() req: any) {
    return this.analyticsService.totalPrincipalAmount(req.user);
  }
  @Get('/total-interest-amount')
  totalInterestAmount(@Req() req: any) {
    return this.analyticsService.totalInterestAmount(req.user);
  }
  @Get('/total-repaid-amount')
  totalRepaidAmount(@Req() req: any) {
    return this.analyticsService.totalRepaidAmount(req.user);
  }
  @Get('/total-pending-amount')
  totalPendingAmount(@Req() req: any) {
    return this.analyticsService.totalPendingAmount(req.user);
  }
  @Get('/total-repayable-amount')
  totalRepayableAmount(@Req() req: any) {
    return this.analyticsService.totalRepayableAmount(req.user);
  }

  @Get('/manager-analytics')
  getManagerAnalytics() {
    return this.analyticsService.getManagerAnalytics();
  }

  @Get('/agent-analytics')
  getAgentAnalytics() {
    return this.analyticsService.getAgentAnalytics();
  }
}
