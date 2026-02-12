import {
    IsString,
    IsEnum,
    IsNumber,
    IsDateString,
    IsArray,
    ValidateNested,
    IsOptional,
    Min,
} from 'class-validator'
import { Type } from 'class-transformer'

import {
    CollectionFrequency,
    FeesPaymentMethod,
    DisbursementMethod,
} from '@prisma/client'


export class FeeDto {
    @IsNumber()
    amount: number   // can be negative

    @IsEnum([true, false] as any)
    isPercentage: boolean

    @IsOptional()
    @IsString()
    description?: string
}

export class CreateLoanDto {
    @IsString()
    customerId: string

    @IsString()
    loanTypeId: string
    @IsString()
    agentId: string

    @IsNumber()
    @Min(1)
    loanAmount: number

    @IsNumber()
    @Min(1)
    loanDuration: number // months

    @IsEnum(CollectionFrequency)
    collectionFreq: CollectionFrequency

    @IsDateString()
    firstEmiDate: string

    @IsEnum(FeesPaymentMethod)
    feesPaymentMethod: FeesPaymentMethod

    @IsEnum(DisbursementMethod)
    disbursementMethod: DisbursementMethod

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeeDto)
    additionalFees: FeeDto[]

}

export class CallVerifyLoanDto {
    // intentionally empty
    // future-proof if you want remarks later
    @IsOptional()
    @IsString()
    remarks?: string
}


export class CompleteFeePaymentDto {
    @IsString()
    id: string;

    @IsString()
    loanId: string;

    @IsString()
    paymentMethod: string;

    @IsString()
    transactionId: string;
}

export class PayEmiDto {

  @Type(() => Number)
  @IsNumber()
  emiNumber: number;

  @Type(() => Number)
  @IsNumber()
  paidAmount: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}


export class AddPenaltyDto {

    @IsNumber()
    emiNumber: number;

    @IsNumber()
    penaltyAmount: number;
}