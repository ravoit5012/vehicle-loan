import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { FeesPaymentMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { calculateTotalFees, calculateFlatLoan, calculateReducingLoan, generateEmiSchedule, calculateDisbursedAmount } from 'src/utils/emi/getPeriodsPerYear';
import { LoanApplicationStatus } from 'src/common/enums/loan-application-status.enum';
import { generateContractPdf } from 'src/utils/pdf/generateContract';
import { uploadToStorage } from 'src/utils/uploadToStorage';
import { CustomersService } from '../customers/customers.service';
import { AccessControlService } from '../access-control/access-control.service';
import { Role } from '@prisma/client';

@Injectable()
export class LoanService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private accessControlService: AccessControlService,
  ) { }

  async createLoanApplication(dto, user?: any) {
    const agentId = dto.agentId;
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    const managerId = customer?.managerId;
    const loanType = await this.prisma.loanType.findUnique({
      where: { id: dto.loanTypeId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (!loanType) {
      throw new NotFoundException('Loan type not found');
    }

    if (loanType.status !== 'APPROVED') {
      throw new BadRequestException('Loan type is not approved and cannot be used');
    }

    if (
      dto.loanAmount < loanType.minAmount ||
      dto.loanAmount > loanType.maxAmount
    ) {
      throw new BadRequestException(
        `Loan amount must be between ${loanType.minAmount} and ${loanType.maxAmount}`,
      );
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
        managerId,
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

        registrationNumber: dto.registrationNumber || null,
        chassisNumber: dto.chassisNumber || null,
        engineNumber: dto.engineNumber || null,
        repoFinancerName: dto.repoFinancerName || null,

        registrationImageUrl: dto.registrationImageUrl || null,
        chassisImageUrl: dto.chassisImageUrl || null,
        engineImageUrl: dto.engineImageUrl || null,
        repoFinancerImageUrl: dto.repoFinancerImageUrl || null,
        vehicleDetailsVerified: user?.role === 'ADMIN' ? true : false,

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
    const loan = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!loan) return null;
    
    const loanType = await this.prisma.loanType.findUnique({
      where: { id: loan.loanTypeId },
      select: { vehicleCondition: true, loanName: true }
    });

    return { ...loan, vehicleCondition: loanType?.vehicleCondition ?? null };
  }

  async checkDuplicateVehicle(dto: { chassisNumber?: string, engineNumber?: string, registrationNumber?: string, repoFinancerName?: string }) {
    const conflicts: string[] = [];
    const checkField = async (field: string, value: string | undefined) => {
      if (!value) return;
      const existing = await this.prisma.loanApplication.findFirst({
        where: {
          [field]: value,
          status: { notIn: ['REJECTED', 'REJECTED_BY_MANAGER', 'REJECTED_BY_ADMIN', 'CLOSED'] } // Skip checking against fully rejected/closed loans
        }
      });
      if (existing) conflicts.push(field);
    };

    await Promise.all([
      checkField('chassisNumber', dto.chassisNumber),
      checkField('engineNumber', dto.engineNumber),
      checkField('registrationNumber', dto.registrationNumber),
    ]);

    return { isDuplicate: conflicts.length > 0, conflicts };
  }

  async updateVehicleDetails(loanId: string, user: any, dto: any) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    // Only prevent edits if it is fully CLOSED
    if (loan.status === LoanApplicationStatus.CLOSED) {
      throw new BadRequestException('Cannot edit vehicle details of a closed loan.');
    }

    // Un-verify if an agent updates it
    const isVerifyChange = user.role === 'ADMIN' ? loan.vehicleDetailsVerified : false;

    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        registrationNumber: dto.registrationNumber,
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        repoFinancerName: dto.repoFinancerName,
        registrationImageUrl: dto.registrationImageUrl,
        chassisImageUrl: dto.chassisImageUrl,
        engineImageUrl: dto.engineImageUrl,
        repoFinancerImageUrl: dto.repoFinancerImageUrl,
        vehicleDetailsVerified: isVerifyChange,
      }
    });
  }

  async updateLoanInfo(loanId: string, user: any, dto: any) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });
    if (!loan) throw new NotFoundException('Loan not found');

    if (!['SUBMITTED', 'PENDING', 'DRAFT', 'CALL_VERIFIED', 'CONTRACT_GENERATED', 'CONTRACT_SIGNED'].includes(loan.status)) {
      throw new BadRequestException('Cannot strictly edit details of a loan that has progressed past pending/submitted statuses.');
    }
    const loanType = await this.prisma.loanType.findUnique({
      where: { id: loan.loanTypeId }
    })

    if (!loanType) throw new BadRequestException("Malfunctioned Loan");
    // const loanType = loan.loanType as any;

    if (
      dto.loanAmount < loanType.minAmount ||
      dto.loanAmount > loanType.maxAmount
    ) {
      throw new BadRequestException(
        `Loan amount must be between ${loanType.minAmount} and ${loanType.maxAmount}`,
      );
    }

    const totalFees = calculateTotalFees(
      dto.loanAmount,
      loanType.processingFees,
      loanType.insuranceFees,
      [...(Array.isArray(loanType.otherFees) ? loanType.otherFees : []), ...dto.additionalFees]
    );

    const loanCalc =
      loanType.interestType === 'FLAT'
        ? calculateFlatLoan(dto.loanAmount, loanType.interestRate, dto.loanDuration, dto.collectionFreq)
        : calculateReducingLoan(dto.loanAmount, loanType.interestRate, dto.loanDuration, dto.collectionFreq);

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

    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        loanAmount: dto.loanAmount,
        loanDuration: dto.loanDuration,
        collectionFreq: dto.collectionFreq,
        otherFees: [...(Array.isArray(loanType.otherFees) ? loanType.otherFees : []), ...dto.additionalFees],
        totalInterest: Math.round(loanCalc.totalInterest * 100) / 100,
        totalPayableAmount: Math.round(loanCalc.totalPayable * 100) / 100,
        disbursedAmount,
        remainingAmount: Math.round(loanCalc.totalPayable * 100) / 100,
        firstEmiDate: dto.firstEmiDate,
        repayments: emiSchedule,
        feesPaymentMethod: dto.feesPaymentMethod,
        disbursementMethod: dto.disbursementMethod,
        status: 'SUBMITTED',
        contractDocument: { unset: true } as any,
        signedContractDocument: { unset: true } as any,
        contractSignedAt: { unset: true } as any,
      },
    });
  }

  async verifyVehicleDetails(loanId: string, user: any) {
    await this.accessControlService.checkAccess(user.role, 'ADMIN_APPROVED' as LoanApplicationStatus); // Effectively Admin only
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: { vehicleDetailsVerified: true }
    });
  }


  async markCallVerified(
    loanId: string,
    user: any
  ) {
    await this.accessControlService.checkAccess(user.role, 'CALL_VERIFIED' as LoanApplicationStatus);
    const managerId = user.id;
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
    user: any
  ) {
    try {
      await this.accessControlService.checkAccess(user.role, 'CONTRACT_GENERATED' as LoanApplicationStatus);
      const managerId = user.id;
      // 1️⃣ Fetch loan with all required relations
      const loan = await this.prisma.loanApplication.findUnique({
        where: { id: loanId },
      })


      if (!loan) {
        throw new NotFoundException('Loan application not found')
      }

      // 2️⃣ Status validation — allow generation OR regeneration before signing
      const allowedStatuses: LoanApplicationStatus[] = [
        LoanApplicationStatus.CALL_VERIFIED,
        LoanApplicationStatus.CONTRACT_GENERATED,
      ];
      if (!allowedStatuses.includes(loan.status as LoanApplicationStatus)) {
        throw new BadRequestException(
          `Contract cannot be generated from status ${loan.status}`,
        );
      }

      // 3️⃣ Once the contract has been signed, it is immutable.
      if (loan.signedContractDocument) {
        throw new BadRequestException(
          'Signed contract already on record — cannot regenerate.',
        );
      }
      const customer = await this.prisma.customer.findUnique({
        where: { id: loan.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found')
      }
      if (!customer.managerId || !customer.agentId) {
        throw new BadRequestException('Malfunctioned Customer')
      }

      const loanType = await this.prisma.loanType.findUnique({
        where: { id: loan.loanTypeId },
      });
      if (!loanType) {
        throw new NotFoundException('Loan type not found')
      }

      const [manager, agent, company] = await Promise.all([
        this.prisma.manager.findUnique({ where: { id: customer.managerId } }),
        this.prisma.agent.findUnique({ where: { id: customer.agentId } }),
        this.prisma.companySettings.findFirst()
      ]);
      if (!company) console.log("Company missing");
      if (!manager) console.log("Manager missing");
      if (!agent) console.log("Agent missing");
      if (!manager || !agent || !company) {
        throw new NotFoundException('Manager, Agent, or Company not found')
      }
      console.log("contract data preparation complete, generating PDF...")
      // 4️⃣ Prepare contract data (FROZEN SNAPSHOT)
      const contractData = {
        contractNumber: `CTR-${loan.id.slice(-6).toUpperCase()}`,
        generatedAt: new Date(),

        company: {
          name: company.companyName,
          email: company.companyEmail,
          phone: company.companyPhone,
          address: company.companyAddress,
          pan: company.panNumber,
        },

        manager: {
          name: manager.name,
          phone: manager.phoneNumber,
        },

        agent: {
          name: agent.name,
          phone: agent.phoneNumber,
        },

        customer: {
          memberId: customer.memberId,
          accountStatus: customer.accountStatus,
          applicantName: customer.applicantName,
          guardianName: customer.guardianName,
          relationType: customer.relationType,
          religion: customer.religion,
          maritalStatus: customer.maritalStatus,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
          gender: customer.gender,
          dob: customer.dateOfBirth,
          panNumber: customer.panNumber,

          address: {
            village: customer.village,
            postOffice: customer.postOffice,
            policeStation: customer.policeStation,
            district: customer.district,
            pinCode: customer.pinCode,
          },

          photo: customer.personalPhotoUrl,
          signature: customer.applicantSignatureUrl,

          documents: {
            pan: customer.panImageUrl,
            poiType: customer.poiDocumentType,
            poiNumber: customer.poiDocumentNumber,
            poiFront: customer.poiFrontImageUrl,
            poiBack: customer.poiBackImageUrl,
            poaType: customer.poaDocumentType,
            poaNumber: customer.poaDocumentNumber,
            poaFront: customer.poaFrontImageUrl,
            poaBack: customer.poaBackImageUrl,
          },

          extraDocuments: customer.extraDocuments || [],
        },

        nominee: {
          name: customer.nomineeName,
          relation: customer.nomineeRelation,
          mobile: customer.nomineeMobileNumber,
          panNumber: customer.nomineePanNumber,

          address: {
            village: customer.nomineeVillage,
            postOffice: customer.nomineePostOffice,
            policeStation: customer.nomineePoliceStation,
            district: customer.nomineeDistrict,
            pinCode: customer.nomineePinCode,
          },

          photo: customer.nomineePersonalPhotoUrl,
          signature: customer.nomineeSignatureUrl,

          documents: {
            pan: customer.nomineePanImageUrl,
            poiType: customer.nomineePoiDocumentType,
            poiNumber: customer.nomineePoiDocumentNumber,
            poiFront: customer.nomineePoiFrontImageUrl,
            poiBack: customer.nomineePoiBackImageUrl,
            poaType: customer.nomineePoaDocumentType,
            poaNumber: customer.nomineePoaDocumentNumber,
            poaFront: customer.nomineePoaFrontImageUrl,
            poaBack: customer.nomineePoaBackImageUrl,
          },
        },

        loan: {
          loanType: loanType.loanName,
          amount: loan.loanAmount,
          interestRate: loan.interestRate,
          interestType: loan.interestType,
          duration: loan.loanDuration,

          totalInterest: loan.totalInterest,
          totalPayable: loan.totalPayableAmount,
          disbursedAmount: loan.disbursedAmount,

          firstEmiDate: loan.firstEmiDate,
          frequency: loan.collectionFreq,
          disbursementMethod: loan.disbursementMethod,
          feesPaymentMethod: loan.feesPaymentMethod,

          registrationNumber: loan.registrationNumber,
          chassisNumber: loan.chassisNumber,
          engineNumber: loan.engineNumber,
          repoFinancerName: loan.repoFinancerName,
          vehicleDetailsVerified: loan.vehicleDetailsVerified,

          registrationImageUrl: loan.registrationImageUrl,
          chassisImageUrl: loan.chassisImageUrl,
          engineImageUrl: loan.engineImageUrl,
          repoFinancerImageUrl: loan.repoFinancerImageUrl,

          fees: {
            processing: loan.processingFees,
            insurance: loan.insuranceFees,
            others: loan.otherFees,
          },

          repayments: loan.repayments,
        }
      };

      // 5️⃣ Generate PDF
      const pdfBuffer = await generateContractPdf(contractData)

      // 6️⃣ Upload PDF to storage — unique key per generation so the public CDN
      //    URL changes on every regen and stale edge-cached copies are bypassed.
      const versionTag = Date.now();
      const contractUrl = await uploadToStorage(
        pdfBuffer,
        `/loan-applications/${loan.id}/generated_contract_${versionTag}.pdf`
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
    user,
  ) {
    try {
      await this.accessControlService.checkAccess(user.role, 'CONTRACT_SIGNED' as LoanApplicationStatus);
      const userId = user.id;
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
    user
  }) {
    try {
      await this.accessControlService.checkAccess(user.role, 'FIELD_VERIFIED' as LoanApplicationStatus);
      const agentId = user.id;
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
    user: any,
    remark: string
  ) {
    await this.accessControlService.checkAccess(user.role, 'ADMIN_APPROVED' as LoanApplicationStatus);
    const adminId = user.id;
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

    if (loan.status !== LoanApplicationStatus.MANAGER_APPROVED) {
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
    user: any,
    remark: string
  ) {
    await this.accessControlService.checkAccess(user.role, 'REJECTED' as LoanApplicationStatus);
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
    user: any
  ) {
    try {
      await this.accessControlService.checkAccess(user.role, 'DISBURSED' as LoanApplicationStatus);
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
    loanId: string,
    user: any
  ) {
    try {
      await this.accessControlService.checkAccess(user.role, 'CLOSED' as LoanApplicationStatus);
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
    const fees = await this.prisma.loanFees.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const customerIds = fees.map(f => f.customerId);
    const loanIds = fees.map(f => f.loanId);

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
    });

    const loans = await this.prisma.loanApplication.findMany({
      where: { id: { in: loanIds } },
    });

    const loanTypeIds = loans.map(l => l.loanTypeId);

    const loanTypes = await this.prisma.loanType.findMany({
      where: { id: { in: loanTypeIds } },
    });

    return fees.map(fee => {
      const customer = customers.find(c => c.id === fee.customerId);
      const loan = loans.find(l => l.id === fee.loanId);
      const loanType = loanTypes.find(
        lt => lt.id === loan?.loanTypeId
      );

      return {
        ...fee,
        customer,
        loan: {
          ...loan,
          loanType,
        },
      };
    });
  }

  async completeFeePayment(id, loanId, paymentMethod, transactionId, receipt: any) {
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

    const receiptUrl = await uploadToStorage(
      receipt.buffer,
      `/loan-fees/${loanId}/${Date.now()}-receipt.jpg`
    );

    return this.prisma.loanFees.update({
      where: { id: fee.id },
      data: {
        paid: true,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        receiptUrl: receiptUrl,
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
