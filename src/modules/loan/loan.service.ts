import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { FeesPaymentMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { calculateTotalFees, calculateFlatLoan, calculateReducingLoan, generateEmiSchedule, calculateDisbursedAmount } from 'src/utils/emi/getPeriodsPerYear';
import { LoanApplicationStatus } from 'src/common/enums/loan-application-status.enum';
import { generateContractPdf } from 'src/utils/generateContractPdf';
import { uploadToStorage } from 'src/utils/uploadToStorage';
import { CustomersService } from '../customers/customers.service';
@Injectable()
export class LoanService {
  constructor(private prisma: PrismaService, private customersService: CustomersService,) { }

  async createLoanApplication(dto) {
    const agentId = dto.agentId;
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    const loanType = await this.prisma.loanType.findUnique({
      where: { id: dto.loanTypeId },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    if (!loanType) {
      throw new Error('Loan type not found');
    }

    if (
      dto.loanAmount < loanType.minAmount ||
      dto.loanAmount > loanType.maxAmount
    ) {
      throw new Error('Loan amount out of bounds');
    }

    // 2️⃣ Calculate Fees
    const totalFees = calculateTotalFees(
      dto.loanAmount,
      loanType.processingFees,
      loanType.insuranceFees,
      [...loanType.otherFees, ...dto.additionalFees]
    );

    // 3️⃣ Interest Calculation
    const loanCalc =
      loanType.interestType === 'FLAT'
        ? calculateFlatLoan(
          dto.loanAmount,
          loanType.interestRate,
          dto.loanDuration,
          dto.collectionFreq
        )
        : calculateReducingLoan(
          dto.loanAmount,
          loanType.interestRate,
          dto.loanDuration,
          dto.collectionFreq
        );

    // 4️⃣ EMI Schedule
    const emiSchedule = generateEmiSchedule(
      dto.loanAmount,
      loanType.interestRate,
      dto.loanDuration,
      dto.collectionFreq,
      dto.firstEmiDate,
      loanType.interestType
    );

    const disbursedAmount = calculateDisbursedAmount(
      dto.loanAmount,
      totalFees,
      dto.feesPaymentMethod
    );

    return this.prisma.loanApplication.create({
      data: {
        customerId: customer.id,
        loanTypeId: loanType.id,
        agentId,
        loanAmount: dto.loanAmount,
        interestRate: loanType.interestRate,
        interestType: loanType.interestType,
        loanDuration: dto.loanDuration,
        collectionFreq: dto.collectionFreq,
        processingFees: loanType.processingFees,
        insuranceFees: loanType.insuranceFees,
        otherFees: [...loanType.otherFees, ...dto.additionalFees],
        totalInterest: Math.round(loanCalc.totalInterest * 100) / 100,
        totalPayableAmount: Math.round(loanCalc.totalPayable * 100) / 100,
        disbursedAmount,
        remainingAmount: Math.round(loanCalc.totalPayable * 100) / 100,
        firstEmiDate: dto.firstEmiDate,
        repayments: emiSchedule,
        feesPaymentMethod: dto.feesPaymentMethod,
        disbursementMethod: dto.disbursementMethod,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

  }

  async getAll() {
    return this.prisma.loanApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return this.prisma.loanApplication.findUnique({
      where: { id },
    });
  }

  async markCallVerified(
    loanId: string,
    managerId: string
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan application not found');
    }

    if (loan.status !== LoanApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        `Loan cannot be call-verified from status ${loan.status}`
      );
    }

    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: LoanApplicationStatus.CALL_VERIFIED,
        managerId,
        callVerifiedAt: new Date(),
      },
    });
  }

  async generateContract(
    loanId: string,
    managerId: string
  ) {
    try {
      // 1️⃣ Fetch loan with all required relations
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
        // include: {
        //   customer: true,
        //   loanType: true,
        //   repayments: true,
        // },
      })

      if (!loan) {
        throw new NotFoundException('Loan application not found')
      }

      // 2️⃣ Status validation
      if (loan.status !== LoanApplicationStatus.CALL_VERIFIED) {
        throw new BadRequestException(
          `Contract cannot be generated from status ${loan.status}`
        )
      }

      // 3️⃣ Prevent regeneration
      if (loan.signedContractDocument) {
        throw new BadRequestException(
          'Contract already generated'
        )
      }
      const customer = await this.prisma.customer.findUnique({
        where: { id: loan.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found')
      }

      const loanType = await this.prisma.loanType.findUnique({
        where: { id: loan.loanTypeId },
      });
      if (!loanType) {
        throw new NotFoundException('Loan type not found')
      }
      // 4️⃣ Prepare contract data (FROZEN SNAPSHOT)
      const contractData = {
        contractNumber: `CTR-${loan.id.slice(-6).toUpperCase()}`,

        customerName: customer.applicantName,
        guardianName: customer.guardianName,
        address: `${customer.village}, ${customer.district}, ${customer.pinCode}`,

        loanType: loanType.loanName,
        loanAmount: loan.loanAmount,
        interestRate: loan.interestRate,
        interestType: loan.interestType,
        durationMonths: loan.loanDuration,

        emiAmount: loan.repayments[0]?.emiAmount,
        totalInterest: loan.totalInterest,
        totalPayable: loan.totalPayableAmount,
        disbursedAmount: loan.disbursedAmount,

        firstEmiDate: loan.firstEmiDate.toISOString().split('T')[0],
        collectionFrequency: loan.collectionFreq,

        generatedAt: new Date().toISOString(),
      }

      // 5️⃣ Generate PDF
      const pdfBuffer = await generateContractPdf(contractData)

      // 6️⃣ Upload PDF to storage
      const contractUrl = await uploadToStorage(
        pdfBuffer,
        `/loan-applications/${loan.id}/generated_contract.pdf`
      )

      // 7️⃣ Update DB (IMMUTABLE RECORD)
      return this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          contractDocument: {
            url: contractUrl,
            uploadedAt: new Date(),
            uploadedById: managerId,
          },
          status: LoanApplicationStatus.CONTRACT_GENERATED,
        },
      })
    } catch (error) {
      console.error(`Failed to generate contract: ${error.message}`)
      throw new BadRequestException(`Failed to generate contract: ${error.message}`)
    }
  }

  async uploadSignedContract(
    loanId,
    file,
    userId,
  ) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId }
      })

      if (!loan) throw new Error("Loan application not found")

      if (loan.status !== "CONTRACT_GENERATED") {
        throw new Error("Contract cannot be signed at this stage")
      }

      if (loan.signedContractDocument) {
        throw new Error("Signed contract already uploaded")
      }

      if (!file || file.mimetype !== "application/pdf") {
        throw new Error("Only PDF files are allowed")
      }

      const relativePath = `/loan-applications/${loanId}/signed-contract.pdf`

      const fileUrl = await uploadToStorage(
        file.buffer,
        relativePath
      )

      await this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: "CONTRACT_SIGNED",
          contractSignedAt: new Date(),
          signedContractDocument: {
            url: fileUrl,
            uploadedAt: new Date(),
            uploadedById: userId,
          }
        }
      })

      return {
        success: true,
        message: "Signed contract uploaded successfully"
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  async fieldVerifyLoan({
    loanId,
    files,
    latitude,
    longitude,
    agentId
  }) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId }
      })

      if (!loan) throw new Error("Loan application not found")

      if (loan.status !== "CONTRACT_SIGNED") {
        throw new Error("Loan not ready for field verification")
      }

      if (loan.housePhotos.length > 0) {
        throw new Error("Field verification already completed")
      }

      if (!files || files.length !== 6) {
        throw new Error("Exactly 6 house photos are required")
      }

      if (
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        throw new Error("Invalid GPS coordinates")
      }

      const housePhotos: any[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.mimetype.startsWith("image/")) {
          throw new Error("Only image files allowed")
        }

        const relativePath =
          `/loan-applications/${loanId}/field-verification/house_${i + 1}.jpg`

        const url = await uploadToStorage(file.buffer, relativePath)
        housePhotos.push({
          url,
          uploadedAt: new Date(),
          uploadedById: agentId,
          capturedLive: true,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        })
      }

      await this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: "FIELD_VERIFIED",
          fieldVerifiedAt: new Date(),
          housePhotos
        }
      })

      return {
        success: true,
        message: "Field verification completed successfully"
      }
    } catch (error) {
      console.error(error)
      throw new BadRequestException(error.message)
    }
  }

  async adminApproveLoan(
    loanId: string,
    adminId: string,
    remark: string
  ) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan application not found');
    }

    if (loan.status !== LoanApplicationStatus.FIELD_VERIFIED) {
      throw new BadRequestException(
        `Loan cannot be admin-approved from status ${loan.status}`
      );
    }

    await this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: LoanApplicationStatus.ADMIN_APPROVED,
        approvedAt: new Date(),
        remark: remark || "NO REMARK PROVIDED",
      },
    });

    return {
      success: true,
      message: "Loan application approved by admin successfully",
    };
  }

  async rejectLoan(
    loanId: string,
    remark: string
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan application not found');
    }

    if (
      loan.status === LoanApplicationStatus.DISBURSED ||
      loan.status === LoanApplicationStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Disbursed or closed loans cannot be rejected`
      );
    }

    await this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: LoanApplicationStatus.REJECTED,
        remark: remark || "NO REMARK PROVIDED",
      },
    });

    return {
      success: true,
      message: "Loan application rejected successfully",
    };
  }

  async disburseLoan(
    loanId: string,
  ) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
      });
      if (!loan) {
        throw new NotFoundException('Loan application not found');
      }
      if (loan.status !== LoanApplicationStatus.ADMIN_APPROVED) {
        throw new BadRequestException(
          `Loan amount cannot be disbursed from status ${loan.status}`
        );
      }

      const customer = await this.customersService.getCustomerById(
        loan.customerId,
      );

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
      const totalFees = calculateTotalFees(
        loan.loanAmount,
        loan.processingFees,
        loan.insuranceFees,
        loan.otherFees,
      );

      const isDeducted = loan.feesPaymentMethod === FeesPaymentMethod.DEDUCTED;

      // await this.prisma.loanApplication.update({
      //   where: { id: loanId },
      //   data: {
      //     status: LoanApplicationStatus.DISBURSED,
      //     approvedAt: new Date(Date.now()),
      //   },
      // });
      await this.prisma.$transaction([
        // Update loan status
        this.prisma.loanApplication.update({
          where: { id: loanId },
          data: {
            status: LoanApplicationStatus.DISBURSED,
            approvedAt: new Date(),
            disbursedAt: new Date(),
          },
        }),

        // Create LoanFees entry
        this.prisma.loanFees.create({
          data: {
            loanId: loan.id,
            customerId: loan.customerId,
            customerName: customer.applicantName,
            customermobileNumber: customer.mobileNumber,
            totalFees: totalFees,

            paid: isDeducted,
            paymentMethod: isDeducted ? 'DISBURSEMENT' : null,
            transactionId: isDeducted ? 'DISBURSEMENT' : null,
            paidAt: isDeducted ? new Date() : null,
          },
        }),
      ]);

      return {
        success: true,
        message: "Loan amount disbursed successfully"
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }



  async closeLoan(
    loanId: string
  ) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
      });
      if (!loan) {
        throw new NotFoundException('Loan application not found');
      }
      // if(loan.remainingAmount > 0){
      //   throw new BadRequestException('Kindly clear all the dues to close the loan');
      // }
      await this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanApplicationStatus.CLOSED,
        },
      });
      return {
        success: true,
        message: "Loan closed successfully"
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: id },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }

    await this.prisma.loanApplication.delete({
      where: { id: id },
    });

    return { message: `Loan with ID ${id} has been successfully removed` };
  }

  async getAllFees() {
    return this.prisma.loanFees.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async completeFeePayment(id, loanId, paymentMethod, transactionId) {
    const fee = await this.prisma.loanFees.findFirst({
      where: {
        id: id,
        loanId: loanId,
      },
    });

    if (!fee) {
      throw new NotFoundException('Fee record not found for this loan');
    }

    if (fee.paid) {
      throw new BadRequestException('Fee already paid');
    }

    if (fee.paymentMethod === 'DISBURSEMENT') {
      throw new BadRequestException(
        'Fees already settled via disbursement',
      );
    }

    return this.prisma.loanFees.update({
      where: { id: fee.id },
      data: {
        paid: true,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        paidAt: new Date(),
      },
    });
  }

  async getAllRepayments() {
    const loans = await this.prisma.loanApplication.findMany({
      select: {
        id: true,
        remainingAmount: true,
        repayments: true, // all repayments of the loan
      },
    });

    // Map each loan to the desired structure
    const result = loans.map(loan => ({
      loanId: loan.id,
      remainingAmount: loan.remainingAmount,
      repayments: loan.repayments,
    }));

    return result;
  }

  async getRepayments(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      select: {
        repayments: true,
        remainingAmount: true,
        status: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  async payEmi(loanId: string, dto, files: any) {

    let proofUrl: string | null = null;

    if (files?.proof?.[0]) {
      const file = files.proof[0];

      proofUrl = await uploadToStorage(
        file.buffer,
        `loan-repayments/${loanId}/emi-${dto.emiNumber}-proof`,
        file.mimetype
      );
    }
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const repayments = [...loan.repayments];
    const index = repayments.findIndex(
      r => r.emiNumber === dto.emiNumber
    );

    if (index === -1) {
      throw new BadRequestException('Invalid EMI number');
    }

    const emi = repayments[index];

    if (emi.status === 'PAID') {
      throw new BadRequestException('EMI already paid');
    }

    // Update EMI
    emi.paidAmount += dto.paidAmount;
    emi.paidDate = new Date();

    if (proofUrl) {
      emi.proofUrl = proofUrl;
    }


    if (emi.paidAmount >= emi.emiAmount) {
      emi.status = 'PAID';
    } else {
      emi.status = 'PARTIAL';
    }

    repayments[index] = emi;

    // Update remaining loan amount
    const newRemaining =
      loan.remainingAmount - dto.paidAmount;

    // Close loan if fully paid
    const newStatus =
      newRemaining <= 0 ? 'CLOSED' : loan.status;

    await this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        repayments,
        remainingAmount: Math.max(newRemaining, 0),
        status: newStatus,
      },
    });

    return {
      message: 'EMI payment recorded',
      emi,
      remainingAmount: Math.max(newRemaining, 0),
      loanStatus: newStatus,
    };
  }

  async addPenalty(loanId: string, dto) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const repayments = [...loan.repayments];
    const index = repayments.findIndex(
      r => r.emiNumber === dto.emiNumber
    );

    if (index === -1) {
      throw new BadRequestException('Invalid EMI number');
    }

    const emi = repayments[index];

    if (emi.status === 'PAID') {
      throw new BadRequestException('Cannot add penalty to paid EMI');
    }

    emi.emiAmount += dto.penaltyAmount;
    repayments[index] = emi;

    await this.prisma.loanApplication.update({
      where: { id: loanId },
      data: { repayments },
    });

    return {
      message: 'Penalty added successfully',
      emi,
    };
  }

}
