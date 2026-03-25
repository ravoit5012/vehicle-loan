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
  countAllLoanTypes() {
    return this.prisma.loanType.count();
  }

  countApprovedLoans() {
    return this.prisma.loanApplication.count({
      where: {
        status: {
          in: [
            LoanApplicationStatus.ADMIN_APPROVED,
            LoanApplicationStatus.DISBURSED,
          ],
        },
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
          status: {
            in: [
              LoanApplicationStatus.ADMIN_APPROVED,
              LoanApplicationStatus.DISBURSED,
            ],
          },
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
          status: {
            in: [
              LoanApplicationStatus.ADMIN_APPROVED,
              LoanApplicationStatus.DISBURSED,
            ],
          },
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
        status: {
            in: [
              LoanApplicationStatus.ADMIN_APPROVED,
              LoanApplicationStatus.DISBURSED,
            ],
          },
      }
    });

    return loans.reduce((loanAcc, loan) => {
      const loanTotal = (loan.repayments || [])
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
          status: {
            in: [
              LoanApplicationStatus.ADMIN_APPROVED,
              LoanApplicationStatus.DISBURSED,
            ],
          },
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
          status: {
            in: [
              LoanApplicationStatus.ADMIN_APPROVED,
              LoanApplicationStatus.DISBURSED,
            ],
          },
        }
      });
    return result._sum.totalPayableAmount || 0;
  }

  async getManagerAnalytics() {
    // 1. Get all managers
    const managers = await this.prisma.manager.findMany({
      select: { id: true, name: true, managerCode: true, status: true },
    });

    // 2. Get all loans grouped data
    const loans = await this.prisma.loanApplication.findMany({
      where: { managerId: { not: null } },
      select: {
        managerId: true,
        status: true,
        loanAmount: true,
        disbursedAmount: true,
        totalPayableAmount: true,
        remainingAmount: true,
        repayments: true,
        customerId: true,
      },
    });

    // 3. Count agents per manager
    const agents = await this.prisma.agent.findMany({
      select: { managerId: true },
    });
    const agentCountMap: Record<string, number> = {};
    agents.forEach((a) => {
      agentCountMap[a.managerId] = (agentCountMap[a.managerId] || 0) + 1;
    });

    // 4. Count customers per manager
    const customers = await this.prisma.customer.findMany({
      select: { managerId: true },
      where: { managerId: { not: null } },
    });
    const customerCountMap: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.managerId) {
        customerCountMap[c.managerId] = (customerCountMap[c.managerId] || 0) + 1;
      }
    });

    // 5. Aggregate per manager
    const approvedStatuses = [
      LoanApplicationStatus.ADMIN_APPROVED,
      LoanApplicationStatus.DISBURSED,
      LoanApplicationStatus.CLOSED,
    ];
    const rejectedStatuses = [
      LoanApplicationStatus.REJECTED,
      LoanApplicationStatus.REJECTED_BY_MANAGER,
      LoanApplicationStatus.REJECTED_BY_ADMIN,
    ];

    const result = managers.map((mgr) => {
      const mgrLoans = loans.filter((l) => l.managerId === mgr.id);

      const totalLoans = mgrLoans.length;
      const approvedLoans = mgrLoans.filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus)).length;
      const rejectedLoans = mgrLoans.filter((l) => rejectedStatuses.includes(l.status as LoanApplicationStatus)).length;
      const pendingLoans = totalLoans - approvedLoans - rejectedLoans;
      const disbursedLoans = mgrLoans.filter((l) => l.status === LoanApplicationStatus.DISBURSED).length;

      const totalDisbursedAmount = mgrLoans
        .filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus))
        .reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);

      const totalRepaidAmount = mgrLoans.reduce((sum, l) => {
        return sum + (l.repayments || []).reduce((rSum, r) => rSum + (r.paidAmount || 0), 0);
      }, 0);

      const totalPendingAmount = mgrLoans
        .filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus))
        .reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

      const uniqueCustomers = new Set(mgrLoans.map((l) => l.customerId));

      return {
        managerId: mgr.id,
        managerName: mgr.name,
        managerCode: mgr.managerCode,
        status: mgr.status,
        totalLoans,
        approvedLoans,
        rejectedLoans,
        pendingLoans,
        disbursedLoans,
        totalDisbursedAmount,
        totalRepaidAmount,
        totalPendingAmount,
        agentCount: agentCountMap[mgr.id] || 0,
        customerCount: customerCountMap[mgr.id] || uniqueCustomers.size,
      };
    });

    // Sort by total loans descending
    result.sort((a, b) => b.totalLoans - a.totalLoans);

    return result;
  }

  async getAgentAnalytics() {
    // 1. Get all agents
    const agents = await this.prisma.agent.findMany({
      select: { id: true, name: true, agentCode: true, status: true },
    });

    // 2. Get all loans
    const loans = await this.prisma.loanApplication.findMany({
      select: {
        agentId: true,
        status: true,
        loanAmount: true,
        disbursedAmount: true,
        totalPayableAmount: true,
        remainingAmount: true,
        repayments: true,
        customerId: true,
      },
    });

    // 3. Count customers per agent
    const customers = await this.prisma.customer.findMany({
      select: { agentId: true },
      where: { agentId: { not: null } },
    });
    const customerCountMap: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.agentId) {
        customerCountMap[c.agentId] = (customerCountMap[c.agentId] || 0) + 1;
      }
    });

    // 4. Aggregate per agent
    const approvedStatuses = [
      LoanApplicationStatus.ADMIN_APPROVED,
      LoanApplicationStatus.DISBURSED,
      LoanApplicationStatus.CLOSED,
    ];
    const rejectedStatuses = [
      LoanApplicationStatus.REJECTED,
      LoanApplicationStatus.REJECTED_BY_MANAGER,
      LoanApplicationStatus.REJECTED_BY_ADMIN,
    ];

    const result = agents.map((agt) => {
      const agtLoans = loans.filter((l) => l.agentId === agt.id);

      const totalLoans = agtLoans.length;
      const approvedLoans = agtLoans.filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus)).length;
      const rejectedLoans = agtLoans.filter((l) => rejectedStatuses.includes(l.status as LoanApplicationStatus)).length;
      const pendingLoans = totalLoans - approvedLoans - rejectedLoans;
      const disbursedLoans = agtLoans.filter((l) => l.status === LoanApplicationStatus.DISBURSED).length;

      const totalDisbursedAmount = agtLoans
        .filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus))
        .reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);

      const totalRepaidAmount = agtLoans.reduce((sum, l) => {
        return sum + (l.repayments || []).reduce((rSum, r) => rSum + (r.paidAmount || 0), 0);
      }, 0);

      const totalPendingAmount = agtLoans
        .filter((l) => approvedStatuses.includes(l.status as LoanApplicationStatus))
        .reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

      const uniqueCustomers = new Set(agtLoans.map((l) => l.customerId));

      return {
        agentId: agt.id,
        agentName: agt.name,
        agentCode: agt.agentCode,
        status: agt.status,
        totalLoans,
        approvedLoans,
        rejectedLoans,
        pendingLoans,
        disbursedLoans,
        totalDisbursedAmount,
        totalRepaidAmount,
        totalPendingAmount,
        customerCount: customerCountMap[agt.id] || uniqueCustomers.size,
      };
    });

    // Sort by total loans descending
    result.sort((a, b) => b.totalLoans - a.totalLoans);

    return result;
  }
}
