import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/all-loan-count')
  findAll() {
    return this.analyticsService.countAllLoans();
  }
  @Get('/all-approved-loan-count')
  findAllApproved() {
    return this.analyticsService.countApprovedLoans();
  }
  @Get('/all-rejected-loan-count')
  findAllRejected() {
    return this.analyticsService.countRejectedLoans();
  }
  @Get('/total-principal-amount')
  totalPrincipalAmount() {
    return this.analyticsService.totalPrincipalAmount();
  }
  @Get('/total-interest-amount')
  totalInterestAmount() {
    return this.analyticsService.totalInterestAmount();
  }
  @Get('/total-repaid-amount')
  totalRepaidAmount() {
    return this.analyticsService.totalRepaidAmount();
  }
  @Get('/total-pending-amount')
  totalPendingAmount() {
    return this.analyticsService.totalPendingAmount();
  }
  @Get('/total-repayable-amount')
  totalRepayableAmount() {
    return this.analyticsService.totalRepayableAmount();
  } 
}
