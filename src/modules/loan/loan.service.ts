import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { calculateTotalFees, calculateFlatLoan, calculateReducingLoan, generateEmiSchedule, calculateDisbursedAmount } from 'src/utils/emi/getPeriodsPerYear';
import { LoanApplicationStatus } from 'src/common/enums/loan-application-status.enum';
import { generateContractPdf } from 'src/utils/generateContractPdf';
import { uploadToStorage } from 'src/utils/uploadToStorage';
@Injectable()
export class LoanService {
  constructor(private prisma: PrismaService) { }

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

    // 1️⃣ Validation
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
      loanCalc.emi,
      dto.firstEmiDate,
      loanCalc.installments,
      dto.collectionFreq
    );

    // 5️⃣ Disbursement
    const disbursedAmount = calculateDisbursedAmount(
      dto.loanAmount,
      totalFees,
      dto.feesPaymentMethod
    );

    return this.prisma.loanApplication.create({
      data: {
        customerId: customer.id,  // Just store the customerId directly
        loanTypeId: loanType.id,
        agentId,  // If agentId is available, just store it directly
        loanAmount: dto.loanAmount,
        interestRate: loanType.interestRate,
        interestType: loanType.interestType,
        loanDuration: dto.loanDuration,
        collectionFreq: dto.collectionFreq,
        processingFees: loanType.processingFees,
        insuranceFees: loanType.insuranceFees,
        otherFees: [...loanType.otherFees, ...dto.additionalFees],
        totalInterest: loanCalc.totalInterest,
        totalPayableAmount: loanCalc.totalPayable,
        disbursedAmount,
        remainingAmount: loanCalc.totalPayable,
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
      // include: {
      //   customer: true,
      //   loanType: true,
      //   agent: true,
      // },
    });
  }

  async getById(id: string) {
    return this.prisma.loanApplication.findUnique({
      where: { id },
      // include: {
      //   customer: true,
      //   loanType: true,
      //   agent: true,
      //   manager: true,
      // },
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
        console.log(latitude, longitude)
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
    adminId: string
  ) {
    try {
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
          approvedAt: new Date(Date.now()),
        },
      });
      return {
        success: true,
        message: "Loan application approved by admin successfully"
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
      await this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanApplicationStatus.DISBURSED,
          approvedAt: new Date(Date.now()),
        },
      });
      return {
        success: true,
        message: "Loan amount disbursed successfully"
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async rejectLoan(
    loanId: string,
    rejectionRemarks: string
  ) {
    try {
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
      });
      if (!loan) {
        throw new NotFoundException('Loan application not found');
      }
      if (loan.status === LoanApplicationStatus.DISBURSED || loan.status === LoanApplicationStatus.CLOSED) {
        throw new BadRequestException(
          `Disbursed or closed loans cannot be rejected`
        );
      }
      const remark = rejectionRemarks ? rejectionRemarks : "NO REMARK PROVIDED";
      await this.prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanApplicationStatus.REJECTED,
          rejectionRemark: remark,
        },
      });
      return {
        success: true,
        message: "Loan application rejected successfully"
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

}
