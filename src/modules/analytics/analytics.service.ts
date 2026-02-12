import { Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoanApplicationStatus } from 'src/common/enums/loan-application-status.enum';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  countAllLoans() {
    return this.prisma.loanApplication.count();
  }

  countApprovedLoans() {
    return this.prisma.loanApplication.count({
      where: {
        status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
      }
    });
  }
  countRejectedLoans() {
    return this.prisma.loanApplication.count({
      where: {
        status: LoanApplicationStatus.REJECTED,
      }
    });
  }

  async totalPrincipalAmount() {
    const result = await this.prisma.loanApplication.aggregate(
      {
        _sum: {
          loanAmount: true,
        },
        where: {
          status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
        }
      }
    );
    return result._sum.loanAmount || 0;
  }

  async totalInterestAmount() {
    const result = await this.prisma.loanApplication.aggregate(
      {
        _sum: { totalInterest: true },
        where: {
          status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
        }
      }
    );
    return result._sum.totalInterest || 0;
  }

  async totalRepaidAmount(): Promise<number> {
    const loans = await this.prisma.loanApplication.findMany({
      select: {
        repayments: true,
      },
      where: {
        status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
      }
    });

    return loans.reduce((loanAcc, loan) => {
      const loanTotal = (loan.repayments || [])
        .filter(rep => rep.status === 'PAID')
        .reduce((repAcc, rep) => repAcc + (rep.paidAmount ?? 0), 0);

      return loanAcc + loanTotal;
    }, 0);
  }


  async totalPendingAmount() {
    const result = await this.prisma.loanApplication.aggregate(
      {
        _sum: {
          remainingAmount: true,
        },
        where: {
          status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
        }
      }
    );
    return result._sum.remainingAmount || 0;
  }

  async totalRepayableAmount() {
    const result = await this.prisma.loanApplication.aggregate(
      {
        _sum: { totalPayableAmount: true, },
        where: {
          status: LoanApplicationStatus.ADMIN_APPROVED || LoanApplicationStatus.DISBURSED,
        }
      });
    return result._sum.totalPayableAmount || 0;
  }
}
