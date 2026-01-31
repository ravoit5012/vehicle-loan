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
    // ======================
    // Relations
    // ======================
    @IsString()
    customerId: string

    @IsString()
    loanTypeId: string

    // ======================
    // Loan Inputs
    // ======================
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

    // ======================
    // Fees & Disbursement
    // ======================
    @IsEnum(FeesPaymentMethod)
    feesPaymentMethod: FeesPaymentMethod

    @IsEnum(DisbursementMethod)
    disbursementMethod: DisbursementMethod

    // ======================
    // Additional / Custom Fees
    // ======================
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

